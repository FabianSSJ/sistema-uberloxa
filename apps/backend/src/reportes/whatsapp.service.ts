import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import { promises as fs } from 'fs';

/**
 * Emisor de WhatsApp vía Baileys (gratis, no oficial). Necesita un número EMISOR dedicado:
 * al primer arranque imprime un QR en la consola del backend; se escanea UNA vez con ese
 * número y la sesión queda guardada en disco (carpeta wa-auth). Si no está conectado, el
 * envío degrada con gracia (devuelve false) y el resto de la app sigue funcionando.
 */
@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private sock: any = null;
  private conectado = false;
  private readonly authDir = path.resolve(process.cwd(), 'wa-auth');

  async onModuleInit() {
    // No bloqueamos el arranque: conectamos en segundo plano.
    this.connect().catch((e) => this.logger.error('No se pudo iniciar WhatsApp', e));
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
        this.logger.log('WhatsApp conectado ✅ (emisor listo para enviar informes).');
        // El QR ya no sirve (código de un solo uso): lo borramos.
        void fs.rm(path.resolve(process.cwd(), 'wa-qr.png'), { force: true }).catch(() => {});
      }
      if (connection === 'close') {
        this.conectado = false;
        const code = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        this.logger.warn(`WhatsApp desconectado (code ${code}). ${loggedOut ? 'Sesión cerrada: borrá wa-auth y re-escaneá.' : 'Reintentando...'}`);
        if (!loggedOut) setTimeout(() => this.connect().catch(() => {}), 5000);
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
