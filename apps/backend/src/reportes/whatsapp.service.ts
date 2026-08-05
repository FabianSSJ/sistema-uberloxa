import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { promises as fs } from 'fs';

// Política de reconexión (backoff exponencial con jitter) — estado del arte recomendado
// para clientes WebSocket de larga vida (Baileys incluido): delay inicial chico, factor de
// crecimiento moderado, techo razonable, +/-25% de jitter para no pegarle todos los clientes
// al server en el mismo instante, y un límite de intentos para no reintentar al infinito
// cuando la reconexión es estructuralmente imposible (sin sesión, nadie escaneó el QR).
const RECONEXION_DELAY_INICIAL_MS = 2_000;
const RECONEXION_DELAY_MAXIMO_MS = 30_000;
const RECONEXION_FACTOR = 1.8;
const RECONEXION_JITTER = 0.25;
const RECONEXION_MAX_INTENTOS = 12;

/**
 * Emisor de WhatsApp vía Baileys (gratis, no oficial). Necesita un número EMISOR dedicado:
 * al primer arranque imprime un QR en la consola del backend; se escanea UNA vez con ese
 * número y la sesión queda guardada en disco (carpeta wa-auth). Si no está conectado, el
 * envío degrada con gracia (devuelve false) y el resto de la app sigue funcionando.
 *
 * Apagado por defecto: sin WHATSAPP_HABILITADO=true en el .env, ni siquiera se intenta
 * conectar. Antes de esto, con la sesión sin vincular en el servidor de producción, el
 * servicio reintentaba conectar cada 5 segundos PARA SIEMPRE (56.000+ intentos en 5 días
 * en los logs reales) — cada intento crea un socket nuevo sin garantía de que el anterior
 * se libere del todo, desperdiciando CPU/memoria 24/7 en un droplet de 1 vCPU / 2GB.
 */
@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private sock: any = null;
  private conectado = false;
  private intentos = 0;
  private readonly authDir = path.resolve(process.cwd(), 'wa-auth');

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    if (!this.config.get<boolean>('WHATSAPP_HABILITADO', false)) {
      this.logger.log('WhatsApp deshabilitado (WHATSAPP_HABILITADO no está en true) — no se intenta conectar.');
      return;
    }
    // No bloqueamos el arranque: conectamos en segundo plano.
    this.connect().catch((e) => this.logger.error('No se pudo iniciar WhatsApp', e));
  }

  /** Cierra el socket anterior antes de crear uno nuevo — sin esto, cada reconexión deja
   *  el WebSocket y sus listeners anteriores sin liberar del todo (leak lento pero real
   *  en un proceso que corre 24/7). */
  private cerrarSocketAnterior() {
    if (!this.sock) return;
    try {
      this.sock.ev?.removeAllListeners?.();
      this.sock.end?.(new Error('reconectando'));
    } catch {
      // best-effort: si ya estaba cerrado no importa
    }
    this.sock = null;
  }

  private calcularDelayReconexion(): number {
    const base = Math.min(
      RECONEXION_DELAY_INICIAL_MS * Math.pow(RECONEXION_FACTOR, this.intentos),
      RECONEXION_DELAY_MAXIMO_MS,
    );
    const jitter = base * RECONEXION_JITTER * (Math.random() * 2 - 1); // +/- 25%
    return Math.round(base + jitter);
  }

  private async connect() {
    let baileys: any;
    try {
      baileys = await import('@whiskeysockets/baileys');
    } catch (e) {
      this.logger.error('No se pudo cargar Baileys (¿instalado?). El informe se generará pero no se enviará.', e as any);
      return;
    }

    const makeWASocket = baileys.default || baileys.makeWASocket;
    const { useMultiFileAuthState, DisconnectReason } = baileys;
    const pino = (await import('pino')).default;
    const qrcode: any = (await import('qrcode')).default;

    this.cerrarSocketAnterior();

    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

    this.sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      markOnlineOnConnect: false,
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', (update: any) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        void this.mostrarQR(qrcode, qr);
      }
      if (connection === 'open') {
        this.conectado = true;
        this.intentos = 0; // reconexión exitosa: se resetea el backoff
        this.logger.log('WhatsApp conectado ✅ (emisor listo para enviar informes).');
        // El QR ya no sirve (código de un solo uso): lo borramos.
        void fs.rm(path.resolve(process.cwd(), 'wa-qr.png'), { force: true }).catch(() => {});
      }
      if (connection === 'close') {
        this.conectado = false;
        const code = lastDisconnect?.error?.output?.statusCode;
        // No-recuperable: requieren re-escanear el QR, reintentar es inútil (ver docs de Baileys).
        const noRecuperable = [
          DisconnectReason.loggedOut,
          DisconnectReason.connectionReplaced,
          DisconnectReason.badSession,
          DisconnectReason.multideviceMismatch,
          DisconnectReason.forbidden,
        ].includes(code);

        if (noRecuperable) {
          this.logger.warn(`WhatsApp desconectado (code ${code}). Sesión inválida: borrá wa-auth y re-escaneá el QR.`);
          return;
        }

        if (this.intentos >= RECONEXION_MAX_INTENTOS) {
          this.logger.error(
            `WhatsApp: ${RECONEXION_MAX_INTENTOS} intentos de reconexión fallidos seguidos (code ${code}). ` +
            'Dejo de reintentar — reiniciá el proceso para intentar de nuevo.',
          );
          return;
        }

        const delay = this.calcularDelayReconexion();
        this.intentos++;
        this.logger.warn(
          `WhatsApp desconectado (code ${code}). Reintentando en ${Math.round(delay / 1000)}s ` +
          `(intento ${this.intentos}/${RECONEXION_MAX_INTENTOS})...`,
        );
        setTimeout(() => this.connect().catch(() => {}), delay);
      }
    });
  }

  /** Muestra el QR de vinculación: en la terminal y como PNG en disco (más confiable en Windows). */
  private async mostrarQR(qrcode: any, qr: string) {
    const pngPath = path.resolve(process.cwd(), 'wa-qr.png');
    try {
      const ascii: string = await qrcode.toString(qr, { type: 'terminal', small: true });
      this.logger.warn('WhatsApp: escaneá este QR con el número EMISOR (una sola vez):\n' + ascii);
    } catch (e) {
      this.logger.error('No se pudo dibujar el QR en la terminal, usá el PNG.', e as any);
    }
    try {
      await qrcode.toFile(pngPath, qr, { width: 320, margin: 2 });
      this.logger.warn(`QR también guardado en: ${pngPath} — abrilo y escaneá desde ahí si en la consola no se ve bien.`);
    } catch (e) {
      this.logger.error('No se pudo guardar el QR como imagen.', e as any);
    }
  }

  estaConectado(): boolean {
    return this.conectado;
  }

  /** Envía un PDF (Buffer) al número indicado. Devuelve false si no hay conexión. */
  async enviarDocumento(numero: string, pdf: Buffer, fileName: string, caption?: string): Promise<boolean> {
    if (!this.sock || !this.conectado) return false;
    const jid = `${numero.replace(/\D/g, '')}@s.whatsapp.net`;
    try {
      await this.sock.sendMessage(jid, {
        document: pdf,
        mimetype: 'application/pdf',
        fileName,
        caption,
      });
      return true;
    } catch (e) {
      this.logger.error(`Error enviando WhatsApp a ${numero}`, e as any);
      return false;
    }
  }
}
