export type DashboardLanguage = "en" | "es";

const copy = {
  en: {
    dashboard: "Dashboard", walker: "Walker dashboard", routes: "Recent routes", walks: "Dog walks", geofences: "Geofences", pets: "My pets", volunteers: "Volunteer groups", lostPets: "Lost pets wall", sensors: "GPS sensors", users: "Users", profile: "My profile", alerts: "Alerts", logout: "Log out",
    demoData: "Demo Data", geofencesToggle: "Geofences", maps: "Maps", clearMap: "Clear map", detailedMap: "Detailed map", controls: "Dashboard controls",
    search: "Search pets, places, geofences...", allCities: "All cities", neighborhood: "Search by neighborhood", owner: "Search by owner name", greeting: "Good afternoon, Daniel ☀", subtitle: "Keep an eye on your pets in real time.",
    petsCount: "Pets", online: "GPS online", safeZones: "Safe zones", alertsCount: "Alerts", lostCount: "Lost pets", recentAlerts: "Recent alerts", noRecentAlerts: "No recent alerts", viewAll: "View all", dismiss: "Dismiss alert", account: "Account details", role: "Role", accountId: "Account ID", language: "Language", switchLanguage: "Switch language", english: "English", spanish: "Spanish",
    onlineLabel: "ONLINE", offlineLabel: "OFFLINE", lostLabel: "LOST", mixedBreed: "Mixed breed", breedAgeWeight: "Breed · Age · Weight", lastSeen: "Last seen", unknown: "Unknown", noLiveLocation: "No live location available", gpsCoordinates: "GPS coordinates", battery: "Battery", signal: "Signal", speed: "Speed", gpsAccuracy: "GPS accuracy", lastUpdate: "Last update", coordinates: "Coordinates", find: "Find", openRoute: "Open route", createGeofence: "Create geofence", report: "View daily report", searchGroup: "Create search group", markLost: "Mark as lost", markFound: "Mark as found", trackedPets: "Tracked pets", myPets: "My pets", guideClose: "Close", guideBack: "Back", guideNext: "Next", guideFinish: "Finish", unknownError: "Unknown error",
  },
  es: {
    dashboard: "Panel", walker: "Panel paseador", routes: "Rutas recientes", walks: "Paseos", geofences: "Geocercas", pets: "Mis mascotas", volunteers: "Grupos de voluntarios", lostPets: "Mascotas perdidas", sensors: "Sensores GPS", users: "Usuarios", profile: "Mi perfil", alerts: "Alertas", logout: "Cerrar sesión",
    demoData: "Datos de demostración", geofencesToggle: "Geocercas", maps: "Mapas", clearMap: "Mapa limpio", detailedMap: "Mapa detallado", controls: "Controles del panel",
    search: "Buscar mascotas, lugares, geocercas...", allCities: "Todas las ciudades", neighborhood: "Buscar por barrio", owner: "Buscar por nombre del dueño", greeting: "Buenas tardes, Daniel ☀", subtitle: "Mantén vigiladas a tus mascotas en tiempo real.",
    petsCount: "Mascotas", online: "GPS en línea", safeZones: "Zonas seguras", alertsCount: "Alertas", lostCount: "Mascotas perdidas", recentAlerts: "Alertas recientes", noRecentAlerts: "No hay alertas recientes", viewAll: "Ver todas", dismiss: "Descartar alerta", account: "Detalles de la cuenta", role: "Rol", accountId: "ID de cuenta", language: "Idioma", switchLanguage: "Cambiar idioma", english: "Inglés", spanish: "Español",
    onlineLabel: "EN LÍNEA", offlineLabel: "SIN CONEXIÓN", lostLabel: "PERDIDA", mixedBreed: "Raza mixta", breedAgeWeight: "Raza · Edad · Peso", lastSeen: "Última ubicación", unknown: "Desconocido", noLiveLocation: "No hay ubicación en vivo", gpsCoordinates: "Coordenadas GPS", battery: "Batería", signal: "Señal", speed: "Velocidad", gpsAccuracy: "Precisión GPS", lastUpdate: "Última actualización", coordinates: "Coordenadas", find: "Buscar", openRoute: "Abrir ruta", createGeofence: "Crear geocerca", report: "Ver reporte diario", searchGroup: "Crear grupo de búsqueda", markLost: "Marcar como perdida", markFound: "Marcar como encontrada", trackedPets: "Mascotas rastreadas", myPets: "Mis mascotas", guideClose: "Cerrar", guideBack: "Atrás", guideNext: "Siguiente", guideFinish: "Finalizar", unknownError: "Error desconocido",
  },
} as const;

export type DashboardCopy = typeof copy.en;
export const getDashboardCopy = (language: DashboardLanguage): DashboardCopy => copy[language];

