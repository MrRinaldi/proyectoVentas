// Categorías como lista vertical (tiendas con categoryLayout "sidebar").
function SidebarCategories({ categories, selectedCategory, setSelectedCategory }) {
  const itemClass = (active) => `w-full text-left p-2 rounded ${active
    ? "bg-[var(--brand)] text-white" : "hover:bg-gray-100"}`;

  return (
    <div>
      <h2 className="font-bold text-lg mb-4">Categorías</h2>
      <ul className="space-y-2">
        <li>
          <button onClick={() => setSelectedCategory(null)} className={itemClass(selectedCategory === null)}>
            Todas
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <button
              onClick={() => setSelectedCategory(category.id)}
              className={itemClass(selectedCategory === category.id)}
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SidebarCategories;
