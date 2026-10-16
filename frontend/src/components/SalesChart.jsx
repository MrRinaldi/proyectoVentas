import { useState } from "react";
import { formatPrice } from "../utils/money";

// "2026-10-15" -> "15 oct" (el día ya viene calculado en la zona de la tienda; se formatea en UTC
// para no moverlo otra vez).
function formatDay(day, locale, options = { day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
}

// Ventas por día: barras finas de una sola serie, con detalle al pasar el ratón o el dedo
// y la misma información en forma de tabla.
function SalesChart({ daily, money }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...daily.map((d) => d.revenue), 0);
  const labelEvery = Math.ceil(daily.length / 6); // ~6 etiquetas en el eje, sin solaparse

  return (
    <div>
      <div className="relative h-56 flex items-end gap-[2px] border-b border-gray-300" onMouseLeave={() => setHovered(null)}>
        {/* Línea guía del máximo, discreta */}
        {max > 0 && (
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-300 pointer-events-none">
            <span className="absolute right-0 -top-5 text-xs text-gray-500">{formatPrice(max, money)}</span>
          </div>
        )}

        {daily.map((d, index) => (
          <div
            key={d.day}
            className="relative flex-1 h-full flex items-end cursor-default"
            onMouseEnter={() => setHovered(index)}
            onTouchStart={() => setHovered(index)}
          >
            <div
              className="w-full rounded-t"
              style={{
                height: max > 0 ? `${(d.revenue / max) * 100}%` : 0,
                minHeight: d.revenue > 0 ? 2 : 0,
                backgroundColor: "var(--chart-series-1)",
                opacity: hovered === null || hovered === index ? 1 : 0.55,
              }}
            />
          </div>
        ))}

        {hovered !== null && (
          <div
            className="absolute -top-2 z-10 bg-white border border-gray-300 rounded-lg shadow px-3 py-2 text-xs text-gray-700 whitespace-nowrap pointer-events-none"
            style={{
              left: `${((hovered + 0.5) / daily.length) * 100}%`,
              transform: `translate(${hovered > daily.length / 2 ? "-100%" : "0"}, -100%)`,
            }}
          >
            <div className="font-semibold text-gray-900">
              {formatDay(daily[hovered].day, money.locale, { weekday: "short", day: "numeric", month: "short" })}
            </div>
            <div>Ventas: {formatPrice(daily[hovered].revenue, money)}</div>
            <div>Pedidos: {daily[hovered].orders}</div>
          </div>
        )}
      </div>

      {/* Eje X: algunas fechas */}
      <div className="flex gap-[2px] mt-1 text-xs text-gray-500">
        {daily.map((d, index) => (
          <div key={d.day} className="flex-1 text-center overflow-visible whitespace-nowrap">
            {index % labelEvery === 0 || index === daily.length - 1 ? formatDay(d.day, money.locale) : ""}
          </div>
        ))}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-gray-600">Ver como tabla</summary>
        <div className="max-h-64 overflow-y-auto mt-2">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-1 pr-4">Día</th>
                <th className="py-1 pr-4 text-right">Pedidos</th>
                <th className="py-1 text-right">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {[...daily].reverse().map((d) => (
                <tr key={d.day} className="border-b last:border-0">
                  <td className="py-1 pr-4">{formatDay(d.day, money.locale, { weekday: "short", day: "numeric", month: "short" })}</td>
                  <td className="py-1 pr-4 text-right">{d.orders}</td>
                  <td className="py-1 text-right">{formatPrice(d.revenue, money)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export default SalesChart;
