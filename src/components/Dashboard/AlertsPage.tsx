import React, { useState } from "react";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BatteryAlertOutlinedIcon from "@mui/icons-material/BatteryAlertOutlined";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import PageHeader from "./ui/PageHeader.tsx";
import { useLiveAlerts } from "../../services/useLiveAlerts.ts";

export default function AlertsPage() {
  const { alerts, connected, dismissAlert } = useLiveAlerts();
  const [filter, setFilter] = useState('Todas');
  const filtered = alerts.filter(alert => filter === 'Todas' || (/bater[ií]a|battery/i.test(alert.message) ? filter === 'Batería' : filter === 'Ubicación'));
  return <div className="firu-content-page">
    <PageHeader title="Alertas" />
    <main className="firu-page-content">
      <div className="firu-filter-tabs" role="group" aria-label="Tipo de alerta">{['Todas', 'Ubicación', 'Batería'].map(label => <button type="button" key={label} className={filter === label ? 'is-active' : ''} aria-pressed={filter === label} onClick={() => setFilter(label)}>{label}</button>)}</div>
      <div className="firu-section-heading firu-alerts-heading"><span>RECIENTES</span><span>{filtered.length} alertas</span></div>
      <div className="firu-alert-list">{filtered.map(alert => <article className="firu-alert-row" key={alert.id}>
        <span className={`firu-alert-symbol ${/bater[ií]a|battery/i.test(alert.message) ? 'is-battery' : ''}`}>{/bater[ií]a|battery/i.test(alert.message) ? <BatteryAlertOutlinedIcon /> : <ErrorOutlineIcon />}</span>
        <div><h2>{alert.message}</h2><p>Notificación del GPS</p><small>{alert.receivedAt}</small></div>
        <IconButton className="firu-alert-dismiss" aria-label={`Descartar alerta ${alert.message}`} size="small" onClick={() => dismissAlert(alert.id)}><CloseIcon fontSize="small" /></IconButton>
      </article>)}</div>
      {!filtered.length && <div className="firu-empty-state"><NotificationsNoneIcon /><h2>Todo tranquilo por aquí</h2><p>{filter === 'Todas' ? 'Las nuevas alertas de tus mascotas aparecerán aquí.' : 'Aún no hay alertas de este tipo.'}</p></div>}
      <div className="firu-info-banner"><NotificationsNoneIcon /><p>{connected ? 'Tus alertas se actualizarán cuando haya cambios en la ubicación o el estado del GPS.' : 'Conectando con las alertas de tus mascotas…'}</p></div>
    </main>
  </div>;
}
