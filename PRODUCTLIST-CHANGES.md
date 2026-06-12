// Temporary file with the specific changes needed for ProductList.jsx

CHANGE 1: After line 23 (const DEFAULT_CATEGORIES = ...), add:
const CUSTOM_CATEGORIES_STORAGE_KEY = 'noor_custom_categories';

const loadSavedCategories = () => {
  try {
    const saved = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error loading saved categories:', e);
    return [];
  }
};

CHANGE 2: In ProductList function, after line 94 "const [editingProductId, setEditingProductId] = useState(null);", add:

  const [defaultCategories, setDefaultCategories] = useState(() => [
    ...DEFAULT_CATEGORIES,
    ...loadSavedCategories()
  ]);

CHANGE 3: Find line ~787 where it says:
{DEFAULT_CATEGORIES.map((cat) => (

And replace it with:
{defaultCategories.map((cat) => (

CHANGE 4: In handleSaveEdit function, after successful API call (around line 620-625), add this code to save the category:

// Save custom category if it's new
const finalCategory = editValues.showCustomCategory ? editValues.customCategory : editValues.category;
if (!DEFAULT_CATEGORIES.includes(finalCategory)) {
  setDefaultCategories(prev => {
    if (!prev.includes(finalCategory)) {
      const updated = [...prev, finalCategory];
      const customCats = updated.filter(cat => !DEFAULT_CATEGORIES.includes(cat));
      try {
        localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(customCats));
      } catch (e) {
        console.error('Error saving categories:', e);
      }
      return updated;
    }
    return prev;
  });
}
