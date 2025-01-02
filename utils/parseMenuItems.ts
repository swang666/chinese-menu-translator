interface MenuItem {
  english: string;
  chinese: string;
  price?: string;
}

export function parseMenuItems(englishText: string, chineseText: string): MenuItem[] {
  // Split both texts into lines
  const englishLines = englishText.split('\n');
  const chineseLines = chineseText.split('\n');
  
  const menuItems: MenuItem[] = [];
  let currentItem: MenuItem | null = null;

  englishLines.forEach((line, index) => {
    // Look for price pattern ($XX.XX)
    const priceMatch = line.match(/\$\d+\.?\d*/);
    
    if (priceMatch) {
      // This line contains a price, likely a menu item
      const price = priceMatch[0];
      const itemName = line.replace(price, '').trim();
      
      currentItem = {
        english: itemName,
        chinese: chineseLines[index] || '',
        price: price
      };
      
      menuItems.push(currentItem);
    } else if (line.trim()) {
      // If it's not empty and doesn't have a price, it might be a description
      if (currentItem) {
        currentItem.english += '\n' + line;
        if (chineseLines[index]) {
          currentItem.chinese += '\n' + chineseLines[index];
        }
      }
    }
  });

  return menuItems;
} 