interface CSVData {
  [key: string]: string | number | Date;
}

export async function parseCSV<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          resolve([]);
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        const result: T[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const currentLine = lines[i].split(',');
          const obj: any = {};
          
          for (let j = 0; j < headers.length; j++) {
            let value: string | number | Date = currentLine[j] || '';
            
            // Try to convert to number if possible
            if (!isNaN(Number(value)) && value !== '') {
              value = Number(value);
            } 
            // Try to convert to date if it matches date format
            else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
              value = new Date(value);
            }
            
            obj[headers[j]] = value;
          }
          
          result.push(obj as T);
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

export async function loadCSVData<T>(filename: string): Promise<T[]> {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`);
    }
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length <= 1) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const result: T[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',');
      const obj: any = {};
      
      for (let j = 0; j < headers.length; j++) {
        let value: string | number | Date = currentLine[j] || '';
        
        // Try to convert to number if possible
        if (!isNaN(Number(value)) && value !== '') {
          value = Number(value);
        } 
        // Try to convert to date if it matches date format
        else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
          value = new Date(value);
        }
        
        obj[headers[j]] = value;
      }
      
      result.push(obj as T);
    }
    
    return result;
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}
