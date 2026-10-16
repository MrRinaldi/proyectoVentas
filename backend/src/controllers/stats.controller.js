// Estadísticas de la tienda para su personal (panel "Estadísticas").
// - Los días se cuentan en la zona horaria de la tienda (businesses.timezone): "hoy" es el hoy de la tienda.
// - Los importes solo suman pedidos no cancelados en la moneda actual de la tienda; los hechos en otra
//   moneda (antes de cambiarla) se cuentan aparte, porque sumar monedas distintas no tiene sentido.
const pool = require("../config/db");

const ALLOWED_PERIODS = [7, 30, 90];
const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

// "YYYY-MM-DD" de una fecha en la zona horaria indicada.
function localDay(date, timezone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(date);
}

// Los `count` días anteriores a `lastDay` (incluido), del más antiguo al más reciente.
function daysUntil(lastDay, count) {
  const [year, month, day] = lastDay.split("-").map(Number);
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(year, month - 1, day - (count - 1 - i))).toISOString().slice(0, 10)
  );
}

exports.getStats = async (req, res) => {
  try {
    const days = ALLOWED_PERIODS.includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const businessId = req.user.businessId;

    const [[business]] = await pool.query(
      "SELECT currency, locale, timezone FROM businesses WHERE id = ?",
      [businessId]
    );
    const { currency, timezone } = business;

    // Período actual y anterior (para comparar), en días de la tienda.
    const today = localDay(new Date(), timezone);
    const currentDays = daysUntil(today, days);
    const previousDays = daysUntil(currentDays[0], days + 1).slice(0, days);
    const currentSet = new Set(currentDays);
    const previousSet = new Set(previousDays);

    // Pedidos de los dos períodos (con un día de margen por la diferencia horaria).
    const [orders] = await pool.query(
      `SELECT id, total, currency, status, customer_id, created_at FROM orders
       WHERE business_id = ? AND created_at >= NOW() - INTERVAL ? DAY`,
      [businessId, days * 2 + 1]
    );

    const summary = { revenue: 0, orders: 0, registeredOrders: 0, otherCurrencyOrders: 0 };
    const previous = { revenue: 0, orders: 0 };
    const byStatus = { pending: 0, confirmed: 0, delivered: 0, cancelled: 0 };
    const daily = new Map(currentDays.map((day) => [day, { day, orders: 0, revenue: 0 }]));
    const validCurrentIds = [];

    for (const order of orders) {
      const day = localDay(order.created_at, timezone);
      const valid = order.status !== "cancelled" && order.currency === currency;

      if (currentSet.has(day)) {
        byStatus[order.status] = (byStatus[order.status] || 0) + 1;
        if (order.status !== "cancelled" && order.currency !== currency) summary.otherCurrencyOrders++;
        if (!valid) continue;
        summary.orders++;
        summary.revenue += Number(order.total);
        if (order.customer_id) summary.registeredOrders++;
        daily.get(day).orders++;
        daily.get(day).revenue += Number(order.total);
        validCurrentIds.push(order.id);
      } else if (previousSet.has(day) && valid) {
        previous.orders++;
        previous.revenue += Number(order.total);
      }
    }

    // Productos más vendidos del período (por importe).
    let topProducts = [];
    if (validCurrentIds.length > 0) {
      [topProducts] = await pool.query(
        `SELECT product_name AS name, SUM(quantity) AS quantity, SUM(quantity * price) AS revenue
         FROM order_items WHERE order_id IN (?)
         GROUP BY product_name
         ORDER BY revenue DESC, quantity DESC
         LIMIT 5`,
        [validCurrentIds]
      );
    }

    const [[{ pending_now: pendingNow }]] = await pool.query(
      "SELECT COUNT(*) AS pending_now FROM orders WHERE business_id = ? AND status = 'pending'",
      [businessId]
    );

    const [customerRows] = await pool.query(
      "SELECT created_at FROM customers WHERE business_id = ?",
      [businessId]
    );
    const [[{ returning }]] = await pool.query(
      `SELECT COUNT(*) AS returning FROM (
         SELECT customer_id FROM orders
         WHERE business_id = ? AND customer_id IS NOT NULL AND status <> 'cancelled'
         GROUP BY customer_id HAVING COUNT(*) >= 2
       ) repeat_buyers`,
      [businessId]
    );

    const revenue = round2(summary.revenue);

    res.json({
      days,
      currency,
      locale: business.locale,
      timezone,
      summary: {
        revenue,
        orders: summary.orders,
        averageTicket: summary.orders ? round2(revenue / summary.orders) : 0,
        pendingNow: Number(pendingNow),
        registeredOrders: summary.registeredOrders,
        otherCurrencyOrders: summary.otherCurrencyOrders,
      },
      previous: { revenue: round2(previous.revenue), orders: previous.orders },
      daily: [...daily.values()].map((d) => ({ ...d, revenue: round2(d.revenue) })),
      byStatus,
      topProducts: topProducts.map((p) => ({ name: p.name, quantity: Number(p.quantity), revenue: round2(p.revenue) })),
      customers: {
        newInPeriod: customerRows.filter((c) => currentSet.has(localDay(c.created_at, timezone))).length,
        total: customerRows.length,
        returning: Number(returning),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo estadísticas" });
  }
};
