const { createElement: h, useEffect, useMemo, useState } = React;
const data = window.enterpriseDashboardData;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function Icon({ name, className = "", size = 18 }) {
  return h("i", {
    "data-lucide": name,
    className,
    "aria-hidden": "true",
    style: { width: `${size}px`, height: `${size}px` },
  });
}

function App() {
  const [period, setPeriod] = useState("30 dias");
  const [channel, setChannel] = useState("Todos");
  const [status, setStatus] = useState("Todos");

  const filteredOrders = useMemo(() => {
    return data.orders.filter((order) => {
      const channelMatch = channel === "Todos" || order.channel === channel;
      const statusMatch = status === "Todos" || order.status === status;
      return channelMatch && statusMatch;
    });
  }, [channel, status]);

  const totals = useMemo(() => {
    const revenue = filteredOrders.reduce((sum, order) => sum + order.amount, 0);
    const criticalStock = data.inventory.filter((item) => item.stock < item.min).length;
    const pendingIntegrations = data.integrations.filter((item) => item.status !== "Sincronizado").length;
    const attentionOrders = filteredOrders.filter((order) => order.status === "Atenção").length;

    return {
      revenue,
      criticalStock,
      pendingIntegrations,
      attentionOrders,
      orderCount: filteredOrders.length,
    };
  }, [filteredOrders]);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  return h(
    "div",
    { className: "app-shell" },
    h(Sidebar),
    h(
      "main",
      { className: "workspace" },
      h(Header, { period }),
      h(FilterBar, { period, setPeriod, channel, setChannel, status, setStatus }),
      h(
        "section",
        { className: "stats-grid", "aria-label": "Indicadores operacionais" },
        h(StatCard, {
          icon: "landmark",
          label: "Receita monitorada",
          value: currency.format(totals.revenue),
          caption: `${totals.orderCount} registros no filtro`,
          trend: "+12,4%",
          tone: "good",
        }),
        h(StatCard, {
          icon: "package-search",
          label: "Estoque crítico",
          value: totals.criticalStock,
          caption: "SKUs abaixo do mínimo",
          trend: "Repor hoje",
          tone: "warn",
        }),
        h(StatCard, {
          icon: "workflow",
          label: "Integrações em atenção",
          value: totals.pendingIntegrations,
          caption: "Rotinas acompanhadas",
          trend: "SLA ativo",
          tone: "info",
        }),
        h(StatCard, {
          icon: "shield-alert",
          label: "Ocorrências abertas",
          value: totals.attentionOrders,
          caption: "Itens exigindo revisão",
          trend: totals.attentionOrders ? "Priorizar" : "Estável",
          tone: totals.attentionOrders ? "bad" : "good",
        }),
      ),
      h(
        "section",
        { className: "dashboard-grid" },
        h(RevenuePanel, { period }),
        h(IntegrationPanel),
        h(OrdersPanel, { orders: filteredOrders }),
        h(InventoryPanel),
        h(ReconciliationPanel),
        h(ActivityPanel),
      ),
    ),
  );
}

function Sidebar() {
  const items = [
    ["layout-dashboard", "Visão geral"],
    ["shopping-cart", "Pedidos"],
    ["package", "Estoque"],
    ["badge-dollar-sign", "Financeiro"],
    ["plug-zap", "Integrações"],
  ];

  return h(
    "aside",
    { className: "sidebar", "aria-label": "Navegação do dashboard" },
    h(
      "div",
      { className: "brand" },
      h("span", { className: "brand-mark" }, "GB"),
      h("span", null, h("strong", null, "Enterprise Dashboard"), h("small", null, "React demo")),
    ),
    h(
      "nav",
      { className: "nav-list" },
      items.map(([icon, label], index) =>
        h(
          "button",
          { className: `nav-item ${index === 0 ? "active" : ""}`, key: label, title: label },
          Icon({ name: icon }),
          h("span", null, label),
        ),
      ),
    ),
    h(
      "div",
      { className: "sidebar-note" },
      Icon({ name: "server-cog" }),
      h("span", null, "Mock enterprise data"),
    ),
  );
}

function Header({ period }) {
  return h(
    "header",
    { className: "topbar" },
    h(
      "div",
      null,
      h("p", { className: "eyebrow" }, "Operação empresarial"),
      h("h1", null, "Dashboard empresarial"),
      h("p", { className: "lede" }, "Pedidos, estoque, finanças e integrações em uma visão executiva para operação corporativa."),
    ),
    h(
      "div",
      { className: "topbar-actions" },
      h("span", { className: "sync-pill" }, Icon({ name: "refresh-cw" }), `Atualizado: ${period}`),
      h("button", { className: "icon-button", title: "Exportar relatório" }, Icon({ name: "download" })),
      h("button", { className: "primary-button" }, Icon({ name: "send" }), "Gerar resumo"),
    ),
  );
}

function FilterBar({ period, setPeriod, channel, setChannel, status, setStatus }) {
  return h(
    "section",
    { className: "filter-bar", "aria-label": "Filtros do dashboard" },
    h(SegmentedControl, {
      label: "Período",
      value: period,
      options: data.filters.periods,
      onChange: setPeriod,
    }),
    h(SelectField, {
      label: "Canal",
      value: channel,
      options: data.filters.channels,
      onChange: setChannel,
    }),
    h(SelectField, {
      label: "Status",
      value: status,
      options: data.filters.statuses,
      onChange: setStatus,
    }),
  );
}

function SegmentedControl({ label, value, options, onChange }) {
  return h(
    "div",
    { className: "field-group wide" },
    h("span", { className: "field-label" }, label),
    h(
      "div",
      { className: "segment" },
      options.map((option) =>
        h(
          "button",
          {
            key: option,
            className: option === value ? "selected" : "",
            onClick: () => onChange(option),
          },
          option,
        ),
      ),
    ),
  );
}

function SelectField({ label, value, options, onChange }) {
  return h(
    "label",
    { className: "field-group" },
    h("span", { className: "field-label" }, label),
    h(
      "select",
      { value, onChange: (event) => onChange(event.target.value) },
      options.map((option) => h("option", { key: option, value: option }, option)),
    ),
  );
}

function StatCard({ icon, label, value, caption, trend, tone }) {
  return h(
    "article",
    { className: `stat-card ${tone}` },
    h("div", { className: "stat-head" }, h("span", { className: "stat-icon" }, Icon({ name: icon })), h("span", { className: "trend" }, trend)),
    h("p", { className: "stat-label" }, label),
    h("strong", null, value),
    h("small", null, caption),
  );
}

function RevenuePanel({ period }) {
  const max = Math.max(...data.revenueSeries.map((item) => item.value));

  return h(
    "article",
    { className: "panel chart-panel" },
    h(PanelHeader, {
      icon: "bar-chart-3",
      title: "Receita e demanda",
      meta: period,
    }),
    h(
      "div",
      { className: "bar-chart", role: "img", "aria-label": "Evolução mensal da operação" },
      data.revenueSeries.map((item) =>
        h(
          "div",
          { className: "bar-item", key: item.label },
          h("span", { style: { height: `${(item.value / max) * 100}%` } }),
          h("small", null, item.label),
        ),
      ),
    ),
    h(
      "div",
      { className: "chart-summary" },
      h("strong", null, "R$ 381 mil"),
      h("span", null, "melhor mês da série"),
    ),
  );
}

function IntegrationPanel() {
  return h(
    "article",
    { className: "panel" },
    h(PanelHeader, { icon: "plug-zap", title: "Fila de integrações", meta: "ERP / financeiro" }),
    h(
      "div",
      { className: "integration-list" },
      data.integrations.map((item) =>
        h(
          "div",
          { className: "integration-row", key: item.system },
          h(
            "div",
            null,
            h("strong", null, item.system),
            h("span", null, item.routine),
          ),
          h(
            "div",
            { className: "integration-meta" },
            h("span", { className: `status-dot ${statusTone(item.status)}` }, item.status),
            h("small", null, `${item.processed} itens | ${item.latency}`),
          ),
          h("div", { className: "health-bar" }, h("span", { style: { width: `${item.health}%` } })),
        ),
      ),
    ),
  );
}

function OrdersPanel({ orders }) {
  return h(
    "article",
    { className: "panel table-panel" },
    h(PanelHeader, { icon: "list-checks", title: "Pedidos e rotinas críticas", meta: `${orders.length} registros` }),
    h(
      "div",
      { className: "table-wrap" },
      h(
        "table",
        null,
        h(
          "thead",
          null,
          h("tr", null, h("th", null, "Código"), h("th", null, "Origem"), h("th", null, "Canal"), h("th", null, "Valor"), h("th", null, "Status"), h("th", null, "SLA")),
        ),
        h(
          "tbody",
          null,
          orders.map((order) =>
            h(
              "tr",
              { key: order.id },
              h("td", null, h("strong", null, order.id), h("small", null, order.owner)),
              h("td", null, order.customer),
              h("td", null, h("span", { className: "channel-pill" }, order.channel)),
              h("td", null, order.amount ? currency.format(order.amount) : "-"),
              h("td", null, h("span", { className: `status-badge ${statusTone(order.status)}` }, order.status)),
              h("td", null, order.sla),
            ),
          ),
        ),
      ),
    ),
  );
}

function InventoryPanel() {
  return h(
    "article",
    { className: "panel" },
    h(PanelHeader, { icon: "package-search", title: "Estoque monitorado", meta: "mínimos operacionais" }),
    h(
      "div",
      { className: "inventory-list" },
      data.inventory.map((item) => {
        const percent = Math.min(100, Math.round((item.stock / item.min) * 100));
        const critical = item.stock < item.min;
        return h(
          "div",
          { className: "inventory-row", key: item.sku },
          h("div", null, h("strong", null, item.item), h("span", null, `${item.sku} | cobertura ${item.coverage}`)),
          h("div", { className: "stock-line" }, h("span", { className: critical ? "low" : "", style: { width: `${percent}%` } })),
          h("small", null, `${item.stock}/${item.min}`),
        );
      }),
    ),
  );
}

function ReconciliationPanel() {
  return h(
    "article",
    { className: "panel compact-panel" },
    h(PanelHeader, { icon: "badge-dollar-sign", title: "Conciliação financeira", meta: "extrato x interno" }),
    h(
      "div",
      { className: "recon-grid" },
      data.reconciliation.map((item) =>
        h(
          "div",
          { className: `recon-item ${item.color}`, key: item.label },
          h("strong", null, `${item.value}%`),
          h("span", null, item.label),
        ),
      ),
    ),
  );
}

function ActivityPanel() {
  return h(
    "article",
    { className: "panel compact-panel" },
    h(PanelHeader, { icon: "activity", title: "Eventos recentes", meta: "operação" }),
    h(
      "ol",
      { className: "timeline" },
      data.timeline.map((item) => h("li", { key: item }, item)),
    ),
  );
}

function PanelHeader({ icon, title, meta }) {
  return h(
    "div",
    { className: "panel-header" },
    h("div", null, h("span", null, Icon({ name: icon })), h("h2", null, title)),
    h("small", null, meta),
  );
}

function statusTone(status) {
  if (status === "Sincronizado" || status === "Concluído") return "good";
  if (status === "Atenção") return "bad";
  if (status === "Aguardando ERP" || status === "Monitorando") return "warn";
  return "info";
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
