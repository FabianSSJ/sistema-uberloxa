--
-- PostgreSQL database dump
--

\restrict qyJY3JA1ecqzLPweYAnMarhs8TH5XsnzFFJc9srkXqn7OVhdjuOtcJdEPoEWvTJ

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: uberloxa
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO uberloxa;

--
-- Name: carreras; Type: TABLE; Schema: public; Owner: uberloxa
--

CREATE TABLE public.carreras (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    unidad_id integer,
    creado_por integer,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    notas text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_fin timestamp(3) without time zone
);


ALTER TABLE public.carreras OWNER TO uberloxa;

--
-- Name: carreras_id_seq; Type: SEQUENCE; Schema: public; Owner: uberloxa
--

CREATE SEQUENCE public.carreras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carreras_id_seq OWNER TO uberloxa;

--
-- Name: carreras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uberloxa
--

ALTER SEQUENCE public.carreras_id_seq OWNED BY public.carreras.id;


--
-- Name: choferes; Type: TABLE; Schema: public; Owner: uberloxa
--

CREATE TABLE public.choferes (
    id integer NOT NULL,
    nombre text NOT NULL,
    telefono text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.choferes OWNER TO uberloxa;

--
-- Name: choferes_id_seq; Type: SEQUENCE; Schema: public; Owner: uberloxa
--

CREATE SEQUENCE public.choferes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.choferes_id_seq OWNER TO uberloxa;

--
-- Name: choferes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uberloxa
--

ALTER SEQUENCE public.choferes_id_seq OWNED BY public.choferes.id;


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: uberloxa
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nombre text NOT NULL,
    telefono text,
    telefono_alt text,
    sector_id integer,
    direccion text,
    descripcion text,
    link_google_maps text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.clientes OWNER TO uberloxa;

--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: uberloxa
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_seq OWNER TO uberloxa;

--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uberloxa
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: historial_estados_carrera; Type: TABLE; Schema: public; Owner: uberloxa
--

CREATE TABLE public.historial_estados_carrera (
    id integer NOT NULL,
    carrera_id integer NOT NULL,
    estado_anterior text,
    estado_nuevo text NOT NULL,
    fecha_hora timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.historial_estados_carrera OWNER TO uberloxa;

--
-- Name: historial_estados_carrera_id_seq; Type: SEQUENCE; Schema: public; Owner: uberloxa
--

CREATE SEQUENCE public.historial_estados_carrera_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_estados_carrera_id_seq OWNER TO uberloxa;

--
-- Name: historial_estados_carrera_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uberloxa
--

ALTER SEQUENCE public.historial_estados_carrera_id_seq OWNED BY public.historial_estados_carrera.id;


--
-- Name: marcas; Type: TABLE; Schema: public; Owner: uberloxa
--

CREATE TABLE public.marcas (
    id integer NOT NULL,
    nombre text NOT NULL
);


ALTER TABLE public.marcas OWNER TO uberloxa;

--
-- Name: marcas_id_seq; Type: SEQUENCE; Schema: public; Owner: uberloxa
--

CREATE SEQUENCE public.marcas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marcas_id_seq OWNER TO uberloxa;

--
-- Name: marcas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uberloxa
--

ALTER SEQUENCE public.marcas_id_seq OWNED BY public.marcas.id;


--
-- Name: modelos; Type: TABLE; Schema: public; Owner: uberloxa
--

CREATE TABLE public.modelos (
    id integer NOT NULL,
    marca_id integer NOT NULL,
    nombre text NOT NULL,
    tipo text
);


ALTER TABLE public.modelos OWNER TO uberloxa;

--
-- Name: modelos_id_seq; Type: SEQUENCE; Schema: public; Owner: uberloxa
--

CREATE SEQUENCE public.modelos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modelos_id_seq OWNER TO uberloxa;

--
-- Name: modelos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uberloxa
--

ALTER SEQUENCE public.modelos_id_seq OWNED BY public.modelos.id;


--
-- Name: sectores; Type: TABLE; Schema: public; Owner: uberloxa
--

CREATE TABLE public.sectores (
    id integer NOT NULL,
    nombre text NOT NULL,
    descripcion text
);


ALTER TABLE public.sectores OWNER TO uberloxa;

--
-- Name: sectores_id_seq; Type: SEQUENCE; Schema: public; Owner: uberloxa
--

CREATE SEQUENCE public.sectores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sectores_id_seq OWNER TO uberloxa;

--
-- Name: sectores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uberloxa
--

ALTER SEQUENCE public.sectores_id_seq OWNED BY public.sectores.id;


--
-- Name: unidades; Type: TABLE; Schema: public; Owner: uberloxa
--

CREATE TABLE public.unidades (
    id integer NOT NULL,
    placa text NOT NULL,
    modelo_id integer,
    chofer_nombre text,
    chofer_telefono text,
    color text,
    anio integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    chofer_id integer,
    numero_unidad text,
    vehiculo text
);


ALTER TABLE public.unidades OWNER TO uberloxa;

--
-- Name: unidades_id_seq; Type: SEQUENCE; Schema: public; Owner: uberloxa
--

CREATE SEQUENCE public.unidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unidades_id_seq OWNER TO uberloxa;

--
-- Name: unidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uberloxa
--

ALTER SEQUENCE public.unidades_id_seq OWNED BY public.unidades.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: uberloxa
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre text NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modulos_permitidos text[] DEFAULT ARRAY[]::text[],
    rol text DEFAULT 'CHARLIE'::text NOT NULL
);


ALTER TABLE public.usuarios OWNER TO uberloxa;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: uberloxa
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO uberloxa;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uberloxa
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: carreras id; Type: DEFAULT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.carreras ALTER COLUMN id SET DEFAULT nextval('public.carreras_id_seq'::regclass);


--
-- Name: choferes id; Type: DEFAULT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.choferes ALTER COLUMN id SET DEFAULT nextval('public.choferes_id_seq'::regclass);


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: historial_estados_carrera id; Type: DEFAULT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.historial_estados_carrera ALTER COLUMN id SET DEFAULT nextval('public.historial_estados_carrera_id_seq'::regclass);


--
-- Name: marcas id; Type: DEFAULT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.marcas ALTER COLUMN id SET DEFAULT nextval('public.marcas_id_seq'::regclass);


--
-- Name: modelos id; Type: DEFAULT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.modelos ALTER COLUMN id SET DEFAULT nextval('public.modelos_id_seq'::regclass);


--
-- Name: sectores id; Type: DEFAULT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.sectores ALTER COLUMN id SET DEFAULT nextval('public.sectores_id_seq'::regclass);


--
-- Name: unidades id; Type: DEFAULT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.unidades ALTER COLUMN id SET DEFAULT nextval('public.unidades_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: uberloxa
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0d6045f1-c582-4c6a-bdb6-85cbf9062429	105c5eac5e6056adab168a2cc9a3c4d36993a839414351e8e617f1e15f275596	2026-06-17 01:09:58.590062+00	20260607081539_init	\N	\N	2026-06-17 01:09:58.39783+00	1
ea7cf5ff-0998-4ef5-9d2e-7be3331cfba6	17f866a16f8917a88f2da0946801d183ccdce326c2c6e628cd4ac7b294a6f3b8	2026-06-17 02:19:30.267794+00	20260617021835_roles_y_choferes	\N	\N	2026-06-17 02:19:30.22211+00	1
\.


--
-- Data for Name: carreras; Type: TABLE DATA; Schema: public; Owner: uberloxa
--

COPY public.carreras (id, cliente_id, unidad_id, creado_por, estado, notas, created_at, fecha_fin) FROM stdin;
\.


--
-- Data for Name: choferes; Type: TABLE DATA; Schema: public; Owner: uberloxa
--

COPY public.choferes (id, nombre, telefono, activo, created_at) FROM stdin;
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: uberloxa
--

COPY public.clientes (id, nombre, telefono, telefono_alt, sector_id, direccion, descripcion, link_google_maps, activo, created_at) FROM stdin;
1	Lucrecia Cabrera	185	\N	1	Juan montalvo y pasaje enrriquez	\N	\N	t	2026-06-17 01:24:16.267
2	Franco Jiron	\N	\N	2	Calle crisantemos y lirios esquina numero de casa 249-21	\N	\N	t	2026-06-17 01:24:16.294
3	Joysy Maza	+5492235907755	\N	3	Sucre entre saraguro y gonzanama frente a medical center	\N	\N	t	2026-06-17 01:24:16.308
4	Sergio Ochoa	0991501989	\N	\N	Clinicar calles alemania y finlandia	\N	\N	t	2026-06-17 01:24:16.312
5	Sheimy Campoverde	0969022137	\N	4	Del redondel de mater dei con direccion a epoca a dos cuadras justo en la parada del bus justo en la señaletica de 50 2.4 con la 09	\N	\N	t	2026-06-17 01:24:16.325
6	Erika Torres	0985877369	\N	5	Por la estados unidos media cuadra antes del semaforo de la iglesia del divino niño, por los condominios divino niño, otra referencia a lado de automotriz jaramillo	\N	\N	t	2026-06-17 01:24:16.336
7	Eli Jimenez	319	\N	6	Via a zamora una cuadra mas arriba de los juegos a mano izquierda	\N	\N	t	2026-06-17 01:24:16.35
8	Estefania Diaz	0	\N	7	Shyris y caras 3 casas antes de llegar a la caras casa color melon turquesa # 451-53	\N	\N	t	2026-06-17 01:24:16.36
9	Mayra Rojas	0994111574	\N	\N	\N	\N	\N	t	2026-06-17 01:24:16.364
10	Sin Nombre	0993916503	\N	8	Argentina entre chile y bolivia 4 casas antes del dragon rojo 2,4 al 45	\N	\N	t	2026-06-17 01:24:16.376
11	Gaby Paucar	0986889750	\N	9	Calle alfredo escarabajay casa de 4 pisos a mitad de cuadra calles entre alfredo mora moreno y guillermo arturo baylon referencia unimax a mano izquierda	\N	\N	t	2026-06-17 01:24:16.387
12	Dalila Jaramillo	0994559144	\N	10	Av eloy alfaro en la ultima cuchara antes de llegar al monumento en la quebrada por la eloy alfaro frente al domicilio de la señora anabel guarderas	\N	\N	t	2026-06-17 01:24:16.399
13	Stalin Chalan	0990186506	\N	11	Lerida y saragoza esquina porton negro	\N	\N	t	2026-06-17 01:24:16.411
14	Jhoana Taday	0967021223	\N	12	Jorge castillo y alberto zambrano. pasando el redondel de materdei en la primera parada del bus entra a mano derecha al fondo casa color blaca de un piso esquinera	\N	\N	t	2026-06-17 01:24:16.421
15	Patricia Mijas	0939581371	\N	7	Shyris entre chorrera y caras 2.4 con la 43, 17, 77	\N	\N	t	2026-06-17 01:24:16.432
16	Paola Toledo	\N	\N	13	Shiris entre mercadillo y nicolasa jurado casa color crema verjas doradas nº 357-39	\N	\N	t	2026-06-17 01:24:16.445
17	Maria Vasquez	0998457084	\N	14	Alexander humbolth e/ faraday y renault por la calle humbolth 2 pisos anaranjada # casa 827-39	\N	\N	t	2026-06-17 01:24:16.455
18	Tatiana Narvaez	0981637094	\N	15	Pasando el ecu al fondo luego a la derecha casa con ladrillo visto porton negro	\N	\N	t	2026-06-17 01:24:16.467
19	Edwin Maurad	0990724488	\N	16	Paraguay y nicaragua a dos casas de talleres fiat uno de don poma numero de casa 230c-37	\N	\N	t	2026-06-17 01:24:16.478
20	Katherine Herrera	0981171805	\N	14	Por la alberth einsten y teodoro wolf pasando un poco la teodoro casa de 2 pisos color melon verja ploma al lado de un paredon color naranja	\N	\N	t	2026-06-17 01:24:16.488
21	Blanca Gomez	0983722611	\N	16	Entre brasil y mexico antes de llegar a la mecanica don pepe n°24-129 casa amarilla puerta café	\N	\N	t	2026-06-17 01:24:16.497
22	Selena Granda	0983699432	\N	10	Manuel cajas entre monseñor oscar romero y nicolás de la peña	\N	\N	t	2026-06-17 01:24:16.509
23	Elizabeth Wuasha	0968111257	\N	17	Jose de artigas / jose de sanmartin y manuel de rosas a mitad de cuadra en la tienda porton negro	\N	\N	t	2026-06-17 01:24:16.519
24	Gloria Montaño	0998381433	\N	18	Entre 8 de diciembre y chuquiribamba una casa de 3 pisos con vidrios circulares azules a lado de una sede de taxis nºde casa 186-36	\N	\N	t	2026-06-17 01:24:16.531
25	Marielena Pucha	0968704552	\N	9	Luis alfonzo benavides y pablo palacios 2 cuadras antes del redondel de consacola	\N	\N	t	2026-06-17 01:24:16.545
26	Doris Riofrio	0967707119	\N	19	Subiendo por la jose maria vivar castro meterse a mano derecha en la miguel iturralde la ultima casa de su mano izquierda casa 3 pisos	\N	\N	t	2026-06-17 01:24:16.556
27	Laura Vega	0989216329	\N	7	Caras y aymaras esquina	\N	\N	t	2026-06-17 01:24:16.567
28	Ximena Tene	0983571770	\N	20	En la cuchara nºde casa 211-038 2.4 con el 09	\N	\N	t	2026-06-17 01:24:16.581
29	Gabriela Patiño	0995727699	\N	21	Calle heroes del cenepa y sargento robles frente a revision vehicular	\N	\N	t	2026-06-17 01:24:16.592
30	Jimmy Diaz	0967292219	\N	22	Jose maria peña pasando la rocafuerte a mano izquierda cuarta casa numero de la casa 339a89 en multieventos loja plastibel lauro guerrero entre miguel riofrio y pasaje la fegue	\N	\N	t	2026-06-17 01:24:16.604
31	Gloria Caraguay	0991182580	\N	23	Entre 10 de agosto y jose antonio justo en y 2,4 con el 55	\N	\N	t	2026-06-17 01:24:16.617
32	Arelis Orellana	0995081633	\N	24	Charity y cumana local pasar el micro mercado el paso de subida antes de llegar al semaforo de la funeraria sueño eterno cayli bazar	\N	\N	t	2026-06-17 01:24:16.628
33	Beccy Burgos	0962847334	\N	25	10 de agosto 3 casas antes de salir a la 18 de noviembre	\N	\N	t	2026-06-17 01:24:16.64
34	Daniela Soto	0990989952	\N	26	Calle berlin pasando uv television a su mano derecha la segunda casa 2.4 con 18, 11	\N	\N	t	2026-06-17 01:24:16.652
35	Gabriela Carrion	0985868755	\N	19	Raphael pullaguari y miguel iturralde eskina casa color melon puerta dorada 2.4 con el 04, 20, 01	\N	\N	t	2026-06-17 01:24:16.661
36	Maria Cruz	0986672278	\N	5	Estados unidos y suecia subiendo por la estados unidos 3 casas antes de llegar a la suecia en el rompe veloidades n° 388-121 porton negro	\N	\N	t	2026-06-17 01:24:16.672
37	Juan Jimbo	\N	\N	27	Manuel cevallos y charles ives casa de 1 piso color azul	\N	\N	t	2026-06-17 01:24:16.684
38	Marianita Guaycha	0992201614	\N	28	Milton jacome ente eloy alfaro y german pitiur	\N	\N	t	2026-06-17 01:24:16.695
39	Paola Saquinaula	0959016326	\N	28	Milton jacome ente eloy alfaro y german pitiur	\N	\N	t	2026-06-17 01:24:16.705
40	Carmen Cordoba	0991189762	\N	29	Paraguay antes de llegar a la aucas	\N	\N	t	2026-06-17 01:24:16.717
41	Jessica Gaona	0939786118	\N	30	Jorge gaitan y americo vespucio	\N	\N	t	2026-06-17 01:24:16.729
42	Edison Torres	0989894001	\N	14	Av piojaramillo entre faraday y jose francisco de caldas casa grande con una enrredadera	\N	\N	t	2026-06-17 01:24:16.738
43	Zonia Quizhpe	0981987208	\N	6	Via a zamora del mirador mas arriba antes de llegar donde eli jimenez 2,4 09, 41	\N	\N	t	2026-06-17 01:24:16.752
44	Andres Barrera	0986971637	\N	1	Lavalleja entre j montalvo y a neumane casa del 03	\N	\N	t	2026-06-17 01:24:16.761
45	Mafer Ordoñez	0959432680	\N	27	Juan jose castillo y manuel quiroga pasando los bomberos del sur la tienda esquinara la tecera casa pisos color blanco de dos pisos	\N	\N	t	2026-06-17 01:24:16.772
46	Bryan Bautista	0983039497	\N	10	Bloque numero 5 frente a los bloques de la policia	\N	\N	t	2026-06-17 01:24:16.783
47	Diego Vidal	0988961017	\N	31	Calle colombia y filipinas justamente en la cancha de cemento en la curva	\N	\N	t	2026-06-17 01:24:16.795
48	Doris Villalta	0999493910	\N	32	Enrique docel entre sirio alegria y alejandro coil cerca de la ferreteria sanchez	\N	\N	t	2026-06-17 01:24:16.809
49	Marlene Salazar	0986698372	\N	29	Calle aucas y paraguay entrando a la cuchara de la aucas casa de 4 pisos filos rojos	\N	\N	t	2026-06-17 01:24:16.818
\.


--
-- Data for Name: historial_estados_carrera; Type: TABLE DATA; Schema: public; Owner: uberloxa
--

COPY public.historial_estados_carrera (id, carrera_id, estado_anterior, estado_nuevo, fecha_hora) FROM stdin;
\.


--
-- Data for Name: marcas; Type: TABLE DATA; Schema: public; Owner: uberloxa
--

COPY public.marcas (id, nombre) FROM stdin;
\.


--
-- Data for Name: modelos; Type: TABLE DATA; Schema: public; Owner: uberloxa
--

COPY public.modelos (id, marca_id, nombre, tipo) FROM stdin;
\.


--
-- Data for Name: sectores; Type: TABLE DATA; Schema: public; Owner: uberloxa
--

COPY public.sectores (id, nombre, descripcion) FROM stdin;
1	Union Lojana	\N
2	Los Geranios	\N
3	Los Molinos	\N
4	Operadores	\N
5	Epoca	\N
6	Palmeras	\N
7	Ciudadela Pio Jaramillo	\N
8	Tebaida Alta	\N
9	Pitas	\N
10	Ciudad Alegria	\N
11	Turunuma Alto	\N
12	Nuevo Amanecer	\N
13	Las Peñas	\N
14	Argelia	\N
15	Turunuma	\N
16	San Pedro	\N
17	Daniel Alvarez	\N
18	Lago Salado	\N
19	Zarzas 2	\N
20	Celi Roman	\N
21	Esteban Godoy 1 Etapa	\N
22	Cuarto Centenario	\N
23	Eplicachima	\N
24	Borja Bajo	\N
25	Centro	\N
26	Palmas Altas	\N
27	Punzara Chico	\N
28	Esteban Godoy 3 Etapa	\N
29	Peñon Del Oeste	\N
30	Zarzas 1	\N
31	Ciudadela Del Maestro 2	\N
32	El Rosal	\N
\.


--
-- Data for Name: unidades; Type: TABLE DATA; Schema: public; Owner: uberloxa
--

COPY public.unidades (id, placa, modelo_id, chofer_nombre, chofer_telefono, color, anio, created_at, chofer_id, numero_unidad, vehiculo) FROM stdin;
1	LBD-3995	\N	José Lenin Jimenez Calva	\N	\N	\N	2026-06-17 04:36:35.689	\N	01	Kia Soluto Plomo
2	LBC 9582	\N	Jeferson Efren Maldonado Calvas	\N	\N	\N	2026-06-19 04:18:13.845	\N	03	Cherry Negro
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: uberloxa
--

COPY public.usuarios (id, nombre, username, password_hash, activo, created_at, modulos_permitidos, rol) FROM stdin;
1	Administrador General	admin	$2b$10$UkQHNiC662NwkndlUuMVmeoioJ1VT9A/IRlc36u7hY2QwfwNPslEK	t	2026-06-17 02:48:18.323	{}	SUPERADMIN
2	Test	testuser	$2b$10$ZnfdaSMKqBXQHdaGWfangOBsTvym.RzzXAtzn30oDI3YQogt/FEvq	t	2026-06-17 03:55:24.658	{}	CHARLIE
\.


--
-- Name: carreras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: uberloxa
--

SELECT pg_catalog.setval('public.carreras_id_seq', 1, false);


--
-- Name: choferes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: uberloxa
--

SELECT pg_catalog.setval('public.choferes_id_seq', 1, false);


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: uberloxa
--

SELECT pg_catalog.setval('public.clientes_id_seq', 49, true);


--
-- Name: historial_estados_carrera_id_seq; Type: SEQUENCE SET; Schema: public; Owner: uberloxa
--

SELECT pg_catalog.setval('public.historial_estados_carrera_id_seq', 1, false);


--
-- Name: marcas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: uberloxa
--

SELECT pg_catalog.setval('public.marcas_id_seq', 1, false);


--
-- Name: modelos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: uberloxa
--

SELECT pg_catalog.setval('public.modelos_id_seq', 1, false);


--
-- Name: sectores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: uberloxa
--

SELECT pg_catalog.setval('public.sectores_id_seq', 32, true);


--
-- Name: unidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: uberloxa
--

SELECT pg_catalog.setval('public.unidades_id_seq', 2, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: uberloxa
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 2, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: carreras carreras_pkey; Type: CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.carreras
    ADD CONSTRAINT carreras_pkey PRIMARY KEY (id);


--
-- Name: choferes choferes_pkey; Type: CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.choferes
    ADD CONSTRAINT choferes_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: historial_estados_carrera historial_estados_carrera_pkey; Type: CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.historial_estados_carrera
    ADD CONSTRAINT historial_estados_carrera_pkey PRIMARY KEY (id);


--
-- Name: marcas marcas_pkey; Type: CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_pkey PRIMARY KEY (id);


--
-- Name: modelos modelos_pkey; Type: CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.modelos
    ADD CONSTRAINT modelos_pkey PRIMARY KEY (id);


--
-- Name: sectores sectores_pkey; Type: CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.sectores
    ADD CONSTRAINT sectores_pkey PRIMARY KEY (id);


--
-- Name: unidades unidades_pkey; Type: CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: carreras_cliente_id_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX carreras_cliente_id_idx ON public.carreras USING btree (cliente_id);


--
-- Name: carreras_created_at_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX carreras_created_at_idx ON public.carreras USING btree (created_at);


--
-- Name: carreras_estado_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX carreras_estado_idx ON public.carreras USING btree (estado);


--
-- Name: carreras_unidad_id_created_at_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX carreras_unidad_id_created_at_idx ON public.carreras USING btree (unidad_id, created_at);


--
-- Name: carreras_unidad_id_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX carreras_unidad_id_idx ON public.carreras USING btree (unidad_id);


--
-- Name: clientes_sector_id_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX clientes_sector_id_idx ON public.clientes USING btree (sector_id);


--
-- Name: clientes_telefono_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX clientes_telefono_idx ON public.clientes USING btree (telefono);


--
-- Name: historial_estados_carrera_carrera_id_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX historial_estados_carrera_carrera_id_idx ON public.historial_estados_carrera USING btree (carrera_id);


--
-- Name: historial_estados_carrera_fecha_hora_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX historial_estados_carrera_fecha_hora_idx ON public.historial_estados_carrera USING btree (fecha_hora);


--
-- Name: marcas_nombre_key; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE UNIQUE INDEX marcas_nombre_key ON public.marcas USING btree (nombre);


--
-- Name: modelos_marca_id_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX modelos_marca_id_idx ON public.modelos USING btree (marca_id);


--
-- Name: sectores_nombre_key; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE UNIQUE INDEX sectores_nombre_key ON public.sectores USING btree (nombre);


--
-- Name: unidades_chofer_id_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX unidades_chofer_id_idx ON public.unidades USING btree (chofer_id);


--
-- Name: unidades_modelo_id_idx; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE INDEX unidades_modelo_id_idx ON public.unidades USING btree (modelo_id);


--
-- Name: unidades_numero_unidad_key; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE UNIQUE INDEX unidades_numero_unidad_key ON public.unidades USING btree (numero_unidad);


--
-- Name: unidades_placa_key; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE UNIQUE INDEX unidades_placa_key ON public.unidades USING btree (placa);


--
-- Name: usuarios_username_key; Type: INDEX; Schema: public; Owner: uberloxa
--

CREATE UNIQUE INDEX usuarios_username_key ON public.usuarios USING btree (username);


--
-- Name: carreras carreras_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.carreras
    ADD CONSTRAINT carreras_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: carreras carreras_unidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.carreras
    ADD CONSTRAINT carreras_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: clientes clientes_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: historial_estados_carrera historial_estados_carrera_carrera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.historial_estados_carrera
    ADD CONSTRAINT historial_estados_carrera_carrera_id_fkey FOREIGN KEY (carrera_id) REFERENCES public.carreras(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: modelos modelos_marca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.modelos
    ADD CONSTRAINT modelos_marca_id_fkey FOREIGN KEY (marca_id) REFERENCES public.marcas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: unidades unidades_chofer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_chofer_id_fkey FOREIGN KEY (chofer_id) REFERENCES public.choferes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: unidades unidades_modelo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uberloxa
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_modelo_id_fkey FOREIGN KEY (modelo_id) REFERENCES public.modelos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict qyJY3JA1ecqzLPweYAnMarhs8TH5XsnzFFJc9srkXqn7OVhdjuOtcJdEPoEWvTJ

