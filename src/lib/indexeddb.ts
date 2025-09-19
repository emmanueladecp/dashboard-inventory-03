/**
 * IndexedDB utility for storing finished goods data
 * Based on MDN documentation: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
 */

export interface FinishedGood {
  id: number;
  AD_Client_ID: {
    propertyLabel: string;
    id: number;
    identifier: string;
    'model-name': string;
  };
  AD_Org_ID: {
    propertyLabel: string;
    id: number;
    identifier: string;
    'model-name': string;
  };
  product_code: string;
  product_name: string;
  M_Product_Category_ID: {
    propertyLabel: string;
    id: number;
    identifier: string;
    'model-name': string;
  };
  catname: string;
  parent1: string;
  parent2: string;
  smalluom: string;
  biguom: string;
  Weight: number;
  catname_value: number;
  parent1_value: number;
  parent2_value: number;
  'model-name': string;
}

export interface FinishedGoodsResponse {
  'page-count': number;
  'records-size': number;
  'skip-records': number;
  'row-count': number;
  'array-count': number;
  records: FinishedGood[];
}

export interface FinishedGoodCategory {
  id: number;
  name: string;
  parent1: string;
  parent2: string;
  parent1_value: number;
  parent2_value: number;
  product_count: number;
}

class FinishedGoodsDB {
  private dbName = 'FinishedGoodsDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create finished_goods object store
        if (!db.objectStoreNames.contains('finished_goods')) {
          const finishedGoodsStore = db.createObjectStore('finished_goods', { keyPath: 'id' });
          finishedGoodsStore.createIndex('product_code', 'product_code', { unique: false });
          finishedGoodsStore.createIndex('catname_value', 'catname_value', { unique: false });
          finishedGoodsStore.createIndex('catname', 'catname', { unique: false });
        }

        // Create categories object store (derived from finished goods data)
        if (!db.objectStoreNames.contains('categories')) {
          const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoriesStore.createIndex('name', 'name', { unique: false });
        }

        // Create metadata object store for sync information
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Store finished goods data in IndexedDB
   */
  async storeFinishedGoods(data: FinishedGoodsResponse): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const transaction = this.db!.transaction(['finished_goods', 'categories', 'metadata'], 'readwrite');
    const finishedGoodsStore = transaction.objectStore('finished_goods');
    const categoriesStore = transaction.objectStore('categories');
    const metadataStore = transaction.objectStore('metadata');

    // Clear existing data
    await this.clearStore(finishedGoodsStore);
    await this.clearStore(categoriesStore);

    // Store finished goods
    for (const record of data.records) {
      finishedGoodsStore.add(record);
    }

    // Extract and store categories
    const categories = this.extractCategories(data.records);
    for (const category of categories) {
      categoriesStore.add(category);
    }

    // Store metadata
    metadataStore.put({
      key: 'last_sync',
      value: new Date().toISOString(),
      record_count: data.records.length
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to store data'));
    });
  }

  /**
   * Get all finished goods from IndexedDB
   */
  async getFinishedGoods(): Promise<FinishedGood[]> {
    if (!this.db) {
      await this.init();
    }

    const transaction = this.db!.transaction(['finished_goods'], 'readonly');
    const store = transaction.objectStore('finished_goods');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to retrieve finished goods'));
    });
  }

  /**
   * Get finished goods by category
   */
  async getFinishedGoodsByCategory(categoryId: number): Promise<FinishedGood[]> {
    if (!this.db) {
      await this.init();
    }

    const transaction = this.db!.transaction(['finished_goods'], 'readonly');
    const store = transaction.objectStore('finished_goods');
    const index = store.index('catname_value');
    const request = index.getAll(categoryId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to retrieve finished goods by category'));
    });
  }

  /**
   * Get all categories from IndexedDB
   */
  async getCategories(): Promise<FinishedGoodCategory[]> {
    if (!this.db) {
      await this.init();
    }

    const transaction = this.db!.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to retrieve categories'));
    });
  }

  /**
   * Search finished goods by product name or code
   */
  async searchFinishedGoods(searchTerm: string): Promise<FinishedGood[]> {
    const allGoods = await this.getFinishedGoods();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allGoods.filter(good => 
      good.product_name.toLowerCase().includes(lowerSearchTerm) ||
      good.product_code.toLowerCase().includes(lowerSearchTerm)
    );
  }

  /**
   * Get sync metadata
   */
  async getSyncMetadata(): Promise<{ key: 'last_sync'; value: string; record_count: number } | undefined> {
    if (!this.db) {
      await this.init();
    }

    const transaction = this.db!.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');
    const request = store.get('last_sync');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as { key: 'last_sync'; value: string; record_count: number } | undefined);
      request.onerror = () => reject(new Error('Failed to retrieve sync metadata'));
    });
  }

  /**
   * Clear all data (called on logout)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const transaction = this.db!.transaction(['finished_goods', 'categories', 'metadata'], 'readwrite');
    const finishedGoodsStore = transaction.objectStore('finished_goods');
    const categoriesStore = transaction.objectStore('categories');
    const metadataStore = transaction.objectStore('metadata');

    await Promise.all([
      this.clearStore(finishedGoodsStore),
      this.clearStore(categoriesStore),
      this.clearStore(metadataStore)
    ]);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear data'));
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Delete the entire database
   */
  async deleteDatabase(): Promise<void> {
    this.close();
    
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(new Error('Failed to delete database'));
    });
  }

  // Private helper methods

  private clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear store'));
    });
  }

  private extractCategories(records: FinishedGood[]): FinishedGoodCategory[] {
    const categoryMap = new Map<number, FinishedGoodCategory>();

    records.forEach(record => {
      const categoryId = record.catname_value;
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: record.catname,
          parent1: record.parent1,
          parent2: record.parent2,
          parent1_value: record.parent1_value,
          parent2_value: record.parent2_value,
          product_count: 0
        });
      }
      
      const category = categoryMap.get(categoryId)!;
      category.product_count += 1;
    });

    return Array.from(categoryMap.values());
  }
}

// Singleton instance
export const finishedGoodsDB = new FinishedGoodsDB();