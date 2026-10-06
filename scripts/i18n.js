/**
 * IceTrack — Internationalization engine (EN / ES)
 *
 * Markup contract
 *   data-i18n="key"                       → element.textContent
 *   data-i18n-html="key"                  → element.innerHTML (trusted, static dictionary markup only)
 *   data-i18n-attr="placeholder:key; aria-label:key2"  → element attributes
 *   data-lang-switch="en|es"              → language toggle buttons (aria-pressed is kept in sync)
 *
 * Public API (window.IceTrackI18n)
 *   t(key, vars?)        → translated string, "{name}" placeholders replaced from vars
 *   setLanguage(lang)    → persists to localStorage, updates <html lang>, re-translates the DOM
 *   getLanguage()        → current language code
 *   apply(root?)         → re-translate a subtree (e.g. after injecting markup)
 *   Fires `icetrack:langchange` on document ({ detail: { lang } }) after every switch.
 *
 * Loaded synchronously in <head> so <html lang> is correct before the first paint.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'icetrack_lang';
  const SUPPORTED = ['en', 'es'];
  const DEFAULT_LANG = 'es';
  const SOURCE_LANG = 'en'; // language the static HTML is authored in

  const dictionary = {
    en: {
      // Document
      'meta.title': 'IceTrack — Industrial IoT Cold Chain Monitoring & Predictive Maintenance',
      'meta.description': 'IceTrack is an IoT data intelligence platform for commercial cold chains: real-time temperature telemetry, automated thermal alerts and predictive refrigeration maintenance.',
      'meta.ogTitle': 'IceTrack — Industrial Data Intelligence for Refrigeration Assets',

      // Accessibility
      'a11y.skip': 'Skip to main content',
      'a11y.home': 'IceTrack — back to top',
      'a11y.primaryNav': 'Primary',
      'a11y.footerNav': 'Footer',
      'a11y.language': 'Language',
      'a11y.menu': 'Menu',
      'a11y.tickerRegion': 'Live fleet telemetry ticker',
      'a11y.pauseTicker': 'Pause live ticker',
      'a11y.pauseTags': 'Pause scrolling tags',

      // Navigation & CTAs
      'nav.solutions': 'Solutions',
      'nav.features': 'Features',
      'nav.about': 'Mission & Vision',
      'nav.hardware': 'IoT Hardware',
      'cta.fieldApp': 'Download Field App',
      'cta.fieldAppShort': 'Field App',
      'cta.console': 'Web Console Sign In',
      'cta.consoleShort': 'Sign In',
      'cta.demo': 'Request Commercial Demo',
      'cta.portal': 'Contractor & Technician Portal',

      // Hero
      'hero.beacon': 'Real-Time IoT Telemetry · Cold Chain Surveillance',
      'hero.title': 'Industrial Data Intelligence to Safeguard Your <span class="hero__title-accent">Refrigeration Assets</span>',
      'hero.clockLabel': 'Industrial Depot · Local Time',
      'hero.uplink': 'Edge Gateway GW-01 · Uplink Stable',
      'hero.lead': 'Prevent costly perishable spoilage, cut electrical waste, and shift from reactive emergency repairs to predictive maintenance — with continuous IoT temperature sensing and automated anomaly alerts.',
      'hero.hint': 'Trigger an event on the live console to watch IceTrack detect, classify and escalate it in real time — the same asset updates in the fleet console further down the page.',

      // Telemetry card
      'sim.label': 'Simulate Event',
      'sim.normal': 'Normal Operation',
      'sim.drift': 'Thermal Drift',
      'sim.breach': 'Power Interruption',
      'sim.offline': 'Probe Disconnect',
      'tel.asset': 'Walk-In Cold Room #02 — Industrial Depot',
      'tel.assetId': 'Asset ID:',
      'tel.range': 'Optimal Range:',
      'tel.rangeValue': '[-20.0 °C to -16.0 °C]',
      'tel.trend': '12-Hour Temperature Trend',
      'tel.chartLabel': '12-hour temperature trend against the optimal range',
      'tel.axis12': '12h ago',
      'tel.axis6': '6h ago',
      'tel.axisNow': 'Now',
      'tel.synced': 'Synced {ago} ago',
      'unit.seconds': '{n}s',

      'scenario.normal.badge': 'Online (MQTT / BLE)',
      'scenario.normal.kpi': 'Live Cabinet Temperature',
      'scenario.normal.load': 'Load',
      'scenario.normal.alerts': 'Active Thermal Alerts',
      'scenario.normal.live': 'Live',
      'scenario.normal.msg': '',
      'scenario.drift.badge': 'Status: Warning',
      'scenario.drift.kpi': 'Live Cabinet Temperature',
      'scenario.drift.load': 'Load',
      'scenario.drift.alerts': 'Active Thermal Alert',
      'scenario.drift.live': 'Live',
      'scenario.drift.msg': 'Thermal drift detected — temperature is approaching the -16.0 °C upper threshold. Push notification sent to 2 operators.',
      'scenario.breach.badge': 'Status: Critical Breach',
      'scenario.breach.kpi': 'Live Cabinet Temperature',
      'scenario.breach.load': '· Power Interrupted',
      'scenario.breach.alerts': 'Active Thermal Alerts',
      'scenario.breach.live': 'Live',
      'scenario.breach.msg': 'Power interruption detected — compressor stalled. SMS escalation dispatched to the on-call HVAC/R technician.',
      'scenario.offline.badge': 'Status: Offline',
      'scenario.offline.kpi': 'Last Known Temperature',
      'scenario.offline.load': 'No Telemetry Received',
      'scenario.offline.alerts': 'Connectivity Alert',
      'scenario.offline.live': 'No Signal',
      'scenario.offline.msg': 'Probe ICE-TRK-COLD-02 stopped reporting. The edge gateway is caching data locally until the link is restored.',

      // Solutions
      'solutions.eyebrow': 'Segmented Solutions',
      'solutions.title': 'Specialized Solutions Across the Cold Chain Lifecycle',
      'solutions.lead': 'Tailored intelligence whether you manage multi-branch inventories or deliver certified field maintenance.',
      'solutions.roleLabel': 'Choose your role',
      'solutions.tabOwner': 'I Operate Facilities',
      'solutions.tabOwnerSub': 'Owners & Directors',
      'solutions.tabTech': 'I Service Equipment',
      'solutions.tabTechSub': 'HVAC/R Technicians',
      'solutions.outcome': 'Measured Outcome',

      'owner.metric': 'Reduction in Spoilage Losses',
      'owner.cta': 'Explore Enterprise Platform',
      'owner.tag': 'Commercial Asset Protection',
      'owner.title': 'Business Owners & Operations Directors',
      'owner.audience': 'Supermarkets, Restaurants & Cold Storage',
      'owner.desc': 'Protect perishable stock, keep health compliance records audit-ready, catch door seal leaks early, and supervise refrigeration performance across every branch from one centralized web console.',
      'owner.f1': 'Inventory preservation',
      'owner.f2': 'Health compliance logs',
      'owner.f3': 'Multi-branch overview',
      'owner.f4': 'Door leak detection',
      'owner.demoTitle': 'Branch Overview',
      'owner.demoCount': '<span class="num">3</span> Locations',
      'owner.b1': 'Downtown Market — Freezer A',
      'owner.b2': 'Harbor Bistro — Walk-In Cooler',
      'owner.b3': 'North Plaza — Dairy Case',
      'owner.b3Alert': 'Door Seal Drift Detected',

      'tech.metric': 'Faster On-Site Diagnosis Time',
      'tech.cta': 'Explore Technician Mobile App',
      'tech.tag': 'Field Service & HVAC/R Operations',
      'tech.title': 'Certified HVAC/R Technicians & Service Contractors',
      'tech.audience': 'Field Diagnostics, Dispatch & Preventive Service',
      'tech.desc': 'Review continuous equipment telemetry history, diagnose compressor performance before the site visit, receive instant fault alerts on your phone, and track every maintenance dispatch.',
      'tech.f1': 'Centralized equipment service history',
      'tech.f2': 'Pre-visit diagnostics',
      'tech.f3': 'Automated fault notifications',
      'tech.f4': 'Field dispatch tracking',
      'tech.demoTitle': 'Compressor Diagnostics — RX-114',
      'tech.demoTag': 'Pre-Visit Check',
      'tech.discharge': 'Discharge',
      'tech.suction': 'Suction',
      'tech.runCycle': 'Run Cycle',
      'tech.shortCycling': 'Short-Cycling Detected',
      'tech.lastService': 'Last service: <span class="num">Jul 14, 2026</span>',

      // Features
      'features.eyebrow': 'Core Capabilities',
      'features.title': 'From Probe to Person: Every Reading Follows the Signal Path',
      'signal.label': 'Signal path',
      'signal.probe': 'Sensor Probe',
      'signal.gateway': 'Edge Gateway',
      'signal.cloud': 'IceTrack Cloud',
      'signal.team': 'Your Team',
      'f1.title': 'Continuous IoT Telemetry',
      'f1.desc': 'Direct sensor integration (<span class="chip-inline">PT100</span>, <span class="chip-inline">NTC</span>, <span class="chip-inline">OEM Controllers</span>) sampled every 30 seconds, with zero data loss through local offline caching.',
      'f1.vizLabel': 'Polling Interval',
      'f2.title': 'Automated Anomaly Alerts',
      'f2.desc': 'Instant multi-tier notifications (<span class="chip-inline">Push</span>, <span class="chip-inline">SMS</span>, <span class="chip-inline">Webhooks</span>) on threshold drift, door-ajar events or power loss.',
      'f2.tier1': 'Tier 1 · Push',
      'f2.tier2': 'Tier 2 · SMS',
      'f2.tier3': 'Tier 3 · Webhook',
      'f3.title': 'Digital Equipment Passports',
      'f3.desc': 'A complete technical history for every asset: compressor operating hours, past repairs and component replacements, and scheduled preventive checkups.',
      'f3.e1': 'Condenser fan replaced',
      'f3.e2': 'Refrigerant charge verified',
      'f3.e3': 'Preventive checkup',
      'f3.d1': 'Mar 2026',
      'f3.d2': 'Jul 2026',
      'f3.d3': 'Nov 2026',
      'f4.title': 'Energy Efficiency Analytics',
      'f4.desc': 'Pinpoint compressor overwork, inefficient defrost cycles and abnormal power draw before they inflate your utility bill.',
      'f4.vizLabel': '7-Day Draw',
      'f4.vizAlert': 'Irregular Draw · Thu',

      // Mission & vision
      'about.eyebrow': 'Institutional Trust',
      'about.title': 'Mission & Strategic Vision',
      'about.missionTitle': 'Our Mission',
      'about.mission': 'To provide an intelligent data platform that empowers businesses to <strong>protect perishable inventory</strong> and optimize refrigeration asset operations, while equipping technicians and service providers with advanced telemetry to <strong>maximize field efficiency</strong> and response capacity.',
      'about.visionTitle': 'Our Strategic Vision',
      'about.vision': 'To become the leading platform for smart refrigeration monitoring and predictive maintenance in Peru and Latin America — the benchmark for cold chain reliability across commercial and industrial operations.',
      'tags.label': 'Technical validation',
      'tags.gateway': 'Industrial Edge Gateway Resilience',
      'tags.mesh': 'Multi-Node Mesh Network',
      'tags.qr': 'Instant Sensor QR Provisioning',

      // IoT hardware & ecosystem
      'hw.eyebrow': 'IoT Hardware & Ecosystem',
      'hw.title': 'One Telemetry Stream, From the Control Room to the Cold Room',
      'hw.lead': 'Industrial-grade hardware feeds one live data stream. Filter the fleet by status on the web console, or acknowledge a breach from the phone — both screens stay in sync.',
      'hw.probesTitle': 'Industrial Sensor Probes',
      'hw.probesText': 'PT100, NTC and OEM controller inputs sampled every 30 seconds.',
      'hw.gatewayTitle': 'Edge Gateways',
      'hw.gatewayText': 'MQTT / BLE uplink with local offline caching when the network drops.',
      'hw.qrTitle': 'Instant QR Provisioning',
      'hw.qrText': 'Scan a probe\'s QR code to pair it with an asset — no manual setup.',

      'filter.label': 'Filter assets by status',
      'filter.all': 'All Assets',
      'filter.status': 'Showing {n} of {total} assets',
      'status.normal': 'Normal',
      'status.warning': 'Warning',
      'status.critical': 'Critical',
      'status.offline': 'Offline',
      'status.ack': 'Acknowledged',
      'status.online': 'Online',

      'console.figure': 'IceTrack Web Console — fleet overview',
      'console.title': 'IceTrack Web Console',
      'console.crumb': '/ Fleet Overview',
      'console.live': 'Live',
      'console.online': 'Assets Online',
      'console.alerts': 'Active Alerts',
      'console.energy': 'Energy Today',
      'console.compliance': 'Compliance Score',
      'console.map': 'Fleet Map — Industrial Depot',
      'console.mapLabel': 'Facility map showing monitored assets and their live status',
      'console.zoneA': 'Zone A — Frozen',
      'console.zoneB': 'Zone B — Chilled',
      'console.dock': 'Loading Dock',
      'console.gateway': 'Edge Gateway',
      'console.energyTitle': 'Energy Breakdown',
      'console.compressors': 'Compressors',
      'console.defrost': 'Defrost Cycles',
      'console.fans': 'Evaporator Fans',
      'console.lighting': 'Lighting & Controls',
      'console.thresholds': 'Threshold Configuration',
      'console.search': 'Search assets…',
      'console.searchLabel': 'Search assets',
      'console.tableLabel': 'Asset thresholds and live status',
      'console.colAsset': 'Asset',
      'console.colZone': 'Zone',
      'console.colMin': 'Min',
      'console.colMax': 'Max',
      'console.colCurrent': 'Current',
      'console.colStatus': 'Status',
      'console.empty': 'No assets match your search.',

      'fleet.cr02': 'Walk-In Cold Room',
      'fleet.fr04': 'Blast Freezer',
      'fleet.ch07': 'Dairy Chiller',
      'fleet.ch03': 'Produce Cooler',
      'fleet.dk01': 'Loading Dock Probe',
      'zone.frozen': 'Frozen',
      'zone.chilled': 'Chilled',
      'zone.ambient': 'Ambient',
      'ticker.gateway': 'Edge Gateway',
      'ticker.fleet': 'FLEET',
      'ticker.energy': 'Energy Today',
      'ticker.uptime': 'UPTIME',
      'ticker.allSystems': 'All Systems',

      'phone.figure': 'IceTrack Field mobile app',
      'phone.sync': 'Live Sync With Console',
      'phone.shift': 'IceTrack Field · On Shift',
      'phone.title': 'Active Alerts',
      'phone.synced': 'Synced',
      'phone.critical': 'Status: Critical Breach',
      'phone.alertAsset': 'Dairy Chiller CH-07 — Industrial Depot',
      'phone.alertMeta': 'Max <span class="num">4.0 °C</span> · Breach for <span class="num">14 min</span>',
      'phone.ack': 'Acknowledge Alert',
      'phone.acked': 'Alert Acknowledged',
      'phone.ackedMeta': 'CH-07 · Dispatch logged · Console updated',
      'phone.undo': 'Undo',
      'phone.scan': 'Scan Probe QR Code',
      'phone.scanning': 'Reading QR code…',
      'phone.paired': 'Probe Paired',
      'phone.pairedStatus': 'Probe PRB-118 paired to Cold Room CR-02.',
      'phone.assigned': 'Assigned Assets',
      'phone.cr02': 'Cold Room CR-02',
      'phone.cr02Meta': 'Mirrors Hero Console',
      'phone.fr04': 'Blast Freezer FR-04',
      'phone.fr04Meta': '<span class="num">-18.6 °C</span> · Low Battery <span class="num">18%</span>',
      'phone.dk01': 'Loading Dock DK-01',
      'phone.dk01Meta': 'Last packet <span class="num">6 min</span> ago',
      'phone.tabAlerts': 'Alerts',
      'phone.tabAssets': 'Assets',
      'phone.tabScan': 'Scan',
      'phone.tabHistory': 'History',

      // Closing banner
      'banner.title': 'Choose your path',
      'banner.opsLabel': 'Operations Path',
      'banner.opsTitle': 'Managing Commercial Refrigeration?',
      'banner.opsText': 'Centralize multi-site telemetry, compliance records and alert routing in one web platform.',
      'banner.opsCta': 'Register Facility (Web Platform)',
      'banner.fieldLabel': 'Field Path',
      'banner.fieldTitle': 'HVAC/R Technician or Contractor?',
      'banner.fieldText': 'Receive threshold alerts, review equipment histories and provision sensors directly from the field.',
      'banner.fieldCta': 'Download Mobile App',
      'banner.or': 'OR',

      // Footer
      'footer.desc': 'IoT data intelligence for commercial cold chains — continuous monitoring, automated thermal alerts and predictive refrigeration maintenance in real time.',
      'footer.uptime': 'All Gateways &amp; Telemetry Services Operational · <span class="num">99.98%</span> System Uptime',
      'footer.platform': 'Platform',
      'footer.webConsole': 'Web Console',
      'footer.fieldApp': 'Field Mobile App',
      'footer.provisioning': 'Sensor Provisioning',
      'footer.gateways': 'Edge Gateways',
      'footer.solutions': 'Solutions',
      'footer.assetProtection': 'Commercial Asset Protection',
      'footer.fieldService': 'Field Service & HVAC/R',
      'footer.energy': 'Energy Analytics',
      'footer.company': 'Company',
      'footer.mission': 'Mission & Vision',
      'footer.capabilities': 'Core Capabilities',
      'footer.contact': 'Contact Sales',
      'footer.status': 'System Status',
      'footer.legal': 'Legal',
      'footer.privacy': 'Privacy Policy',
      'footer.terms': 'Terms of Service',
      'footer.dpa': 'Data Processing Agreement',
      'footer.compliance': 'Compliance Center',
      'footer.rights': 'All rights reserved.',
      'footer.cookies': 'Cookie Preferences',
      'footer.security': 'Security',
      'footer.accessibility': 'Accessibility',
    },

    es: {
      // Documento
      'meta.title': 'IceTrack — Monitoreo IoT Industrial de Cadena de Frío y Mantenimiento Predictivo',
      'meta.description': 'IceTrack es una plataforma de inteligencia de datos IoT para cadenas de frío comerciales: telemetría de temperatura en tiempo real, alertas térmicas automatizadas y mantenimiento predictivo de refrigeración.',
      'meta.ogTitle': 'IceTrack — Inteligencia de Datos Industrial para Activos de Refrigeración',

      // Accesibilidad
      'a11y.skip': 'Saltar al contenido principal',
      'a11y.home': 'IceTrack — volver al inicio',
      'a11y.primaryNav': 'Principal',
      'a11y.footerNav': 'Pie de página',
      'a11y.language': 'Idioma',
      'a11y.menu': 'Menú',
      'a11y.tickerRegion': 'Cinta de telemetría de la flota en vivo',
      'a11y.pauseTicker': 'Pausar cinta en vivo',
      'a11y.pauseTags': 'Pausar etiquetas en movimiento',

      // Navegación y CTAs
      'nav.solutions': 'Soluciones',
      'nav.features': 'Funciones',
      'nav.about': 'Misión y Visión',
      'nav.hardware': 'Hardware IoT',
      'cta.fieldApp': 'Descargar App de Campo',
      'cta.fieldAppShort': 'App de Campo',
      'cta.console': 'Acceso Consola Web',
      'cta.consoleShort': 'Ingresar',
      'cta.demo': 'Solicitar Demo Comercial',
      'cta.portal': 'Portal de Técnicos y Contratistas',

      // Hero
      'hero.beacon': 'Telemetría IoT en Tiempo Real · Vigilancia de Cadena de Frío',
      'hero.title': 'Inteligencia de Datos Industrial para Proteger sus <span class="hero__title-accent">Activos de Refrigeración</span>',
      'hero.clockLabel': 'Depósito Industrial · Hora Local',
      'hero.uplink': 'Gateway Edge GW-01 · Enlace Estable',
      'hero.lead': 'Evite pérdidas costosas de productos perecibles, reduzca el desperdicio eléctrico y pase de las reparaciones de emergencia al mantenimiento predictivo, con monitoreo IoT continuo de temperatura y alertas automáticas de anomalías.',
      'hero.hint': 'Simule un evento en la consola en vivo y vea cómo IceTrack lo detecta, clasifica y escala en tiempo real: el mismo activo se actualiza en la consola de flota más abajo.',

      // Tarjeta de telemetría
      'sim.label': 'Simular Evento',
      'sim.normal': 'Operación Normal',
      'sim.drift': 'Deriva Térmica',
      'sim.breach': 'Corte de Energía',
      'sim.offline': 'Sonda Desconectada',
      'tel.asset': 'Cámara Frigorífica #02 — Depósito Industrial',
      'tel.assetId': 'ID de Activo:',
      'tel.range': 'Rango Óptimo:',
      'tel.rangeValue': '[-20.0 °C a -16.0 °C]',
      'tel.trend': 'Tendencia de Temperatura · 12 Horas',
      'tel.chartLabel': 'Tendencia de temperatura de 12 horas frente al rango óptimo',
      'tel.axis12': 'Hace 12 h',
      'tel.axis6': 'Hace 6 h',
      'tel.axisNow': 'Ahora',
      'tel.synced': 'Sincronizado hace {ago}',
      'unit.seconds': '{n} s',

      'scenario.normal.badge': 'En Línea (MQTT / BLE)',
      'scenario.normal.kpi': 'Temperatura de Cámara en Vivo',
      'scenario.normal.load': 'Carga',
      'scenario.normal.alerts': 'Alertas Térmicas Activas',
      'scenario.normal.live': 'En Vivo',
      'scenario.normal.msg': '',
      'scenario.drift.badge': 'Estado: Advertencia',
      'scenario.drift.kpi': 'Temperatura de Cámara en Vivo',
      'scenario.drift.load': 'Carga',
      'scenario.drift.alerts': 'Alerta Térmica Activa',
      'scenario.drift.live': 'En Vivo',
      'scenario.drift.msg': 'Deriva térmica detectada: la temperatura se acerca al umbral superior de -16.0 °C. Notificación push enviada a 2 operadores.',
      'scenario.breach.badge': 'Estado: Alerta Crítica',
      'scenario.breach.kpi': 'Temperatura de Cámara en Vivo',
      'scenario.breach.load': '· Energía Interrumpida',
      'scenario.breach.alerts': 'Alertas Térmicas Activas',
      'scenario.breach.live': 'En Vivo',
      'scenario.breach.msg': 'Corte de energía detectado: compresor detenido. Escalamiento por SMS enviado al técnico HVAC/R de turno.',
      'scenario.offline.badge': 'Estado: Sin Conexión',
      'scenario.offline.kpi': 'Última Temperatura Registrada',
      'scenario.offline.load': 'Sin Telemetría',
      'scenario.offline.alerts': 'Alerta de Conectividad',
      'scenario.offline.live': 'Sin Señal',
      'scenario.offline.msg': 'La sonda ICE-TRK-COLD-02 dejó de reportar. El gateway edge almacena los datos localmente hasta restablecer el enlace.',

      // Soluciones
      'solutions.eyebrow': 'Soluciones Segmentadas',
      'solutions.title': 'Soluciones Especializadas para Todo el Ciclo de la Cadena de Frío',
      'solutions.lead': 'Inteligencia a la medida, ya sea que gestione inventarios en múltiples sedes o brinde mantenimiento certificado en campo.',
      'solutions.roleLabel': 'Elija su perfil',
      'solutions.tabOwner': 'Opero Instalaciones',
      'solutions.tabOwnerSub': 'Dueños y Directores',
      'solutions.tabTech': 'Doy Servicio a Equipos',
      'solutions.tabTechSub': 'Técnicos HVAC/R',
      'solutions.outcome': 'Resultado Medido',

      'owner.metric': 'Reducción en Pérdidas por Deterioro',
      'owner.cta': 'Explorar Plataforma Empresarial',
      'owner.tag': 'Protección de Activos Comerciales',
      'owner.title': 'Dueños de Negocio y Directores de Operaciones',
      'owner.audience': 'Supermercados, Restaurantes y Almacenes Frigoríficos',
      'owner.desc': 'Proteja su inventario perecible, mantenga sus registros de cumplimiento sanitario listos para auditoría, detecte a tiempo fugas en los sellos de puertas y supervise la refrigeración de todas sus sedes desde una consola web centralizada.',
      'owner.f1': 'Preservación de inventario',
      'owner.f2': 'Registros de cumplimiento sanitario',
      'owner.f3': 'Vista consolidada multisede',
      'owner.f4': 'Detección de fugas en puertas',
      'owner.demoTitle': 'Resumen de Sedes',
      'owner.demoCount': '<span class="num">3</span> Sedes',
      'owner.b1': 'Mercado Central — Congelador A',
      'owner.b2': 'Bistró del Puerto — Cámara de Frío',
      'owner.b3': 'Plaza Norte — Vitrina de Lácteos',
      'owner.b3Alert': 'Falla en Sello de Puerta Detectada',

      'tech.metric': 'Diagnóstico en Sitio Más Rápido',
      'tech.cta': 'Explorar App Móvil para Técnicos',
      'tech.tag': 'Servicio de Campo y Operaciones HVAC/R',
      'tech.title': 'Técnicos HVAC/R Certificados y Contratistas de Servicio',
      'tech.audience': 'Diagnóstico en Campo, Despacho y Servicio Preventivo',
      'tech.desc': 'Revise el historial continuo de telemetría de cada equipo, diagnostique el rendimiento del compresor antes de la visita, reciba alertas de fallas al instante en su celular y haga seguimiento de cada despacho de mantenimiento.',
      'tech.f1': 'Historial de servicio centralizado',
      'tech.f2': 'Diagnóstico previo a la visita',
      'tech.f3': 'Notificaciones automáticas de fallas',
      'tech.f4': 'Seguimiento de despachos en campo',
      'tech.demoTitle': 'Diagnóstico de Compresor — RX-114',
      'tech.demoTag': 'Revisión Previa',
      'tech.discharge': 'Descarga',
      'tech.suction': 'Succión',
      'tech.runCycle': 'Ciclo de Marcha',
      'tech.shortCycling': 'Ciclos Cortos Detectados',
      'tech.lastService': 'Último servicio: <span class="num">14 jul 2026</span>',

      // Funciones
      'features.eyebrow': 'Capacidades Clave',
      'features.title': 'De la Sonda a su Equipo: Cada Lectura Sigue la Ruta de la Señal',
      'signal.label': 'Ruta de la señal',
      'signal.probe': 'Sonda',
      'signal.gateway': 'Gateway Edge',
      'signal.cloud': 'Nube IceTrack',
      'signal.team': 'Su Equipo',
      'f1.title': 'Telemetría IoT Continua',
      'f1.desc': 'Integración directa de sensores (<span class="chip-inline">PT100</span>, <span class="chip-inline">NTC</span>, <span class="chip-inline">Controladores OEM</span>) con muestreo cada 30 segundos y cero pérdida de datos gracias al almacenamiento local sin conexión.',
      'f1.vizLabel': 'Intervalo de Muestreo',
      'f2.title': 'Alertas Automáticas de Anomalías',
      'f2.desc': 'Notificaciones instantáneas por niveles (<span class="chip-inline">Push</span>, <span class="chip-inline">SMS</span>, <span class="chip-inline">Webhooks</span>) ante desviaciones de umbral, puertas abiertas o cortes de energía.',
      'f2.tier1': 'Nivel 1 · Push',
      'f2.tier2': 'Nivel 2 · SMS',
      'f2.tier3': 'Nivel 3 · Webhook',
      'f3.title': 'Pasaportes Digitales de Equipos',
      'f3.desc': 'Un historial técnico completo de cada activo: horas de operación del compresor, reparaciones y reemplazos de componentes, y mantenimientos preventivos programados.',
      'f3.e1': 'Ventilador del condensador reemplazado',
      'f3.e2': 'Carga de refrigerante verificada',
      'f3.e3': 'Mantenimiento preventivo',
      'f3.d1': 'mar 2026',
      'f3.d2': 'jul 2026',
      'f3.d3': 'nov 2026',
      'f4.title': 'Analítica de Eficiencia Energética',
      'f4.desc': 'Identifique sobreesfuerzo del compresor, ciclos de deshielo ineficientes y consumos eléctricos anómalos antes de que inflen su factura de energía.',
      'f4.vizLabel': 'Consumo 7 Días',
      'f4.vizAlert': 'Consumo Irregular · Jue',

      // Misión y visión
      'about.eyebrow': 'Confianza Institucional',
      'about.title': 'Misión y Visión Estratégica',
      'about.missionTitle': 'Nuestra Misión',
      'about.mission': 'Brindar una plataforma inteligente de datos que permita a las empresas <strong>proteger su inventario perecible</strong> y optimizar la operación de sus activos de refrigeración, equipando a técnicos y proveedores de servicio con telemetría avanzada para <strong>maximizar su eficiencia en campo</strong> y su capacidad de respuesta.',
      'about.visionTitle': 'Nuestra Visión Estratégica',
      'about.vision': 'Convertirnos en la plataforma líder de monitoreo inteligente de refrigeración y mantenimiento predictivo en el Perú y Latinoamérica: el referente de confiabilidad de la cadena de frío en operaciones comerciales e industriales.',
      'tags.label': 'Validación técnica',
      'tags.gateway': 'Resiliencia de Gateway Edge Industrial',
      'tags.mesh': 'Red Mesh Multinodo',
      'tags.qr': 'Aprovisionamiento QR Instantáneo de Sensores',

      // Hardware IoT y ecosistema
      'hw.eyebrow': 'Hardware IoT y Ecosistema',
      'hw.title': 'Un Solo Flujo de Telemetría, de la Sala de Control a la Cámara de Frío',
      'hw.lead': 'Hardware de grado industrial alimenta un único flujo de datos en vivo. Filtre la flota por estado en la consola web o confirme una alerta desde el celular: ambas pantallas se mantienen sincronizadas.',
      'hw.probesTitle': 'Sondas Industriales',
      'hw.probesText': 'Entradas PT100, NTC y de controladores OEM muestreadas cada 30 segundos.',
      'hw.gatewayTitle': 'Gateways Edge',
      'hw.gatewayText': 'Enlace MQTT / BLE con almacenamiento local cuando se cae la red.',
      'hw.qrTitle': 'Aprovisionamiento QR Instantáneo',
      'hw.qrText': 'Escanee el código QR de una sonda para vincularla a un activo, sin configuración manual.',

      'filter.label': 'Filtrar activos por estado',
      'filter.all': 'Todos',
      'filter.status': 'Mostrando {n} de {total} activos',
      'status.normal': 'Normal',
      'status.warning': 'Advertencia',
      'status.critical': 'Crítico',
      'status.offline': 'Sin Conexión',
      'status.ack': 'Confirmado',
      'status.online': 'En Línea',

      'console.figure': 'Consola Web IceTrack — resumen de flota',
      'console.title': 'Consola Web IceTrack',
      'console.crumb': '/ Resumen de Flota',
      'console.live': 'En Vivo',
      'console.online': 'Activos en Línea',
      'console.alerts': 'Alertas Activas',
      'console.energy': 'Energía Hoy',
      'console.compliance': 'Índice de Cumplimiento',
      'console.map': 'Mapa de Flota — Depósito Industrial',
      'console.mapLabel': 'Mapa de la instalación con los activos monitoreados y su estado en vivo',
      'console.zoneA': 'Zona A — Congelados',
      'console.zoneB': 'Zona B — Refrigerados',
      'console.dock': 'Andén de Carga',
      'console.gateway': 'Gateway Edge',
      'console.energyTitle': 'Desglose de Energía',
      'console.compressors': 'Compresores',
      'console.defrost': 'Ciclos de Deshielo',
      'console.fans': 'Ventiladores del Evaporador',
      'console.lighting': 'Iluminación y Controles',
      'console.thresholds': 'Configuración de Umbrales',
      'console.search': 'Buscar activos…',
      'console.searchLabel': 'Buscar activos',
      'console.tableLabel': 'Umbrales y estado en vivo de los activos',
      'console.colAsset': 'Activo',
      'console.colZone': 'Zona',
      'console.colMin': 'Mín',
      'console.colMax': 'Máx',
      'console.colCurrent': 'Actual',
      'console.colStatus': 'Estado',
      'console.empty': 'Ningún activo coincide con su búsqueda.',

      'fleet.cr02': 'Cámara Frigorífica',
      'fleet.fr04': 'Congelador Rápido',
      'fleet.ch07': 'Enfriador de Lácteos',
      'fleet.ch03': 'Cámara de Frutas y Verduras',
      'fleet.dk01': 'Sonda del Andén de Carga',
      'zone.frozen': 'Congelados',
      'zone.chilled': 'Refrigerados',
      'zone.ambient': 'Ambiente',
      'ticker.gateway': 'Gateway Edge',
      'ticker.fleet': 'FLOTA',
      'ticker.energy': 'Energía Hoy',
      'ticker.uptime': 'DISPONIBILIDAD',
      'ticker.allSystems': 'Todos los Sistemas',

      'phone.figure': 'App móvil IceTrack Campo',
      'phone.sync': 'Sincronizado con la Consola',
      'phone.shift': 'IceTrack Campo · En Turno',
      'phone.title': 'Alertas Activas',
      'phone.synced': 'Sincronizado',
      'phone.critical': 'Estado: Alerta Crítica',
      'phone.alertAsset': 'Enfriador de Lácteos CH-07 — Depósito Industrial',
      'phone.alertMeta': 'Máx <span class="num">4.0 °C</span> · Fuera de rango hace <span class="num">14 min</span>',
      'phone.ack': 'Confirmar Alerta',
      'phone.acked': 'Alerta Confirmada',
      'phone.ackedMeta': 'CH-07 · Despacho registrado · Consola actualizada',
      'phone.undo': 'Deshacer',
      'phone.scan': 'Escanear QR de Sonda',
      'phone.scanning': 'Leyendo código QR…',
      'phone.paired': 'Sonda Vinculada',
      'phone.pairedStatus': 'Sonda PRB-118 vinculada a la Cámara CR-02.',
      'phone.assigned': 'Activos Asignados',
      'phone.cr02': 'Cámara CR-02',
      'phone.cr02Meta': 'Refleja la consola principal',
      'phone.fr04': 'Congelador Rápido FR-04',
      'phone.fr04Meta': '<span class="num">-18.6 °C</span> · Batería Baja <span class="num">18%</span>',
      'phone.dk01': 'Andén de Carga DK-01',
      'phone.dk01Meta': 'Último paquete hace <span class="num">6 min</span>',
      'phone.tabAlerts': 'Alertas',
      'phone.tabAssets': 'Activos',
      'phone.tabScan': 'Escanear',
      'phone.tabHistory': 'Historial',

      // Banner de cierre
      'banner.title': 'Elija su camino',
      'banner.opsLabel': 'Ruta de Operaciones',
      'banner.opsTitle': '¿Gestiona Refrigeración Comercial?',
      'banner.opsText': 'Centralice la telemetría de todas sus sedes, los registros de cumplimiento y el enrutamiento de alertas en una sola plataforma web.',
      'banner.opsCta': 'Registrar Instalación (Plataforma Web)',
      'banner.fieldLabel': 'Ruta de Campo',
      'banner.fieldTitle': '¿Técnico o Contratista HVAC/R?',
      'banner.fieldText': 'Reciba alertas de umbral, revise historiales de equipos y aprovisione sensores directamente desde el campo.',
      'banner.fieldCta': 'Descargar App Móvil',
      'banner.or': 'O',

      // Pie de página
      'footer.desc': 'Inteligencia de datos IoT para cadenas de frío comerciales: monitoreo continuo, alertas térmicas automatizadas y mantenimiento predictivo de refrigeración en tiempo real.',
      'footer.uptime': 'Todos los Gateways y Servicios de Telemetría Operativos · <span class="num">99.98%</span> de Disponibilidad',
      'footer.platform': 'Plataforma',
      'footer.webConsole': 'Consola Web',
      'footer.fieldApp': 'App Móvil de Campo',
      'footer.provisioning': 'Aprovisionamiento de Sensores',
      'footer.gateways': 'Gateways Edge',
      'footer.solutions': 'Soluciones',
      'footer.assetProtection': 'Protección de Activos Comerciales',
      'footer.fieldService': 'Servicio de Campo y HVAC/R',
      'footer.energy': 'Analítica Energética',
      'footer.company': 'Empresa',
      'footer.mission': 'Misión y Visión',
      'footer.capabilities': 'Capacidades Clave',
      'footer.contact': 'Contactar a Ventas',
      'footer.status': 'Estado del Sistema',
      'footer.legal': 'Legal',
      'footer.privacy': 'Política de Privacidad',
      'footer.terms': 'Términos del Servicio',
      'footer.dpa': 'Acuerdo de Tratamiento de Datos',
      'footer.compliance': 'Centro de Cumplimiento',
      'footer.rights': 'Todos los derechos reservados.',
      'footer.cookies': 'Preferencias de Cookies',
      'footer.security': 'Seguridad',
      'footer.accessibility': 'Accesibilidad',
    },
  };

  const root = document.documentElement;
  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  const readStored = () => {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null; // storage blocked (private mode, sandboxed iframe…)
    }
  };

  const writeStored = (lang) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      /* ignore — the switch still works for this page view */
    }
  };

  const normalize = (tag) => {
    if (!tag) return null;
    const base = String(tag).toLowerCase().split('-')[0];
    return SUPPORTED.includes(base) ? base : null;
  };

  const detect = () => {
    const stored = normalize(readStored());
    if (stored) return stored;
    const preferred = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const tag of preferred) {
      const match = normalize(tag);
      if (match) return match;
    }
    return DEFAULT_LANG;
  };

  let current = detect();

  // Runs before <body> is parsed.
  root.lang = current;
  root.classList.add('js');
  if (current !== SOURCE_LANG) {
    root.classList.add('i18n-pending');
    // Safety net: never keep the page hidden if something below fails.
    window.setTimeout(() => root.classList.remove('i18n-pending'), 2500);
  }

  const t = (key, vars) => {
    const table = dictionary[current] || {};
    let str = hasOwn(table, key) ? table[key] : dictionary[SOURCE_LANG][key];
    if (str == null) {
      console.warn(`[IceTrack i18n] Missing translation key: "${key}"`);
      return key;
    }
    if (vars) {
      str = str.replace(/\{(\w+)\}/g, (match, name) => (vars[name] != null ? String(vars[name]) : match));
    }
    return str;
  };

  const apply = (scope = document) => {
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });

    scope.querySelectorAll('[data-i18n-html]').forEach((el) => {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });

    scope.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.getAttribute('data-i18n-attr')
        .split(';')
        .map((pair) => pair.trim())
        .filter(Boolean)
        .forEach((pair) => {
          const sep = pair.indexOf(':');
          if (sep < 1) return;
          const attr = pair.slice(0, sep).trim();
          const key = pair.slice(sep + 1).trim();
          el.setAttribute(attr, t(key));
        });
    });

    scope.querySelectorAll('[data-lang-switch]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-switch') === current));
    });
  };

  const setLanguage = (lang) => {
    const next = normalize(lang);
    if (!next) return;
    const changed = next !== current;
    current = next;
    writeStored(next);
    root.lang = next;
    apply();
    if (changed) {
      document.dispatchEvent(new CustomEvent('icetrack:langchange', { detail: { lang: next } }));
    }
  };

  const init = () => {
    try {
      apply();
    } finally {
      root.classList.remove('i18n-pending');
    }

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-lang-switch]');
      if (button) setLanguage(button.getAttribute('data-lang-switch'));
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.IceTrackI18n = Object.freeze({
    t,
    setLanguage,
    getLanguage: () => current,
    apply,
    languages: SUPPORTED.slice(),
  });
})();
