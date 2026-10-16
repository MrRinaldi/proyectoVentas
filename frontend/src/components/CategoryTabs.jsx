// Categorías como pestañas horizontales (tiendas con categoryLayout "tabs").
function CategoryTabs({ categories, selectedCategory, setSelectedCategory }) {
  const tabClass = (active) => `flex-shrink-0 px-5 py-3 font-semibold whitespace-nowrap border-b-4 transition ${active
    ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-gray-600 hover:text-gray-900"}`;

  return (
    <nav className="bg-white shadow-sm">
      <div className="flex overflow-x-auto">
        <button onClick={() => setSelectedCategory(null)} className={tabClass(selectedCategory === null)}>
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={tabClass(selectedCategory === category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default CategoryTabs;
