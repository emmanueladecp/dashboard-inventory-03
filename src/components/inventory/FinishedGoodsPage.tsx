/**
 * Main Finished Goods component
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, Package, Loader2, RefreshCw, Filter, AlertCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useFinishedGoods } from '@/hooks/useFinishedGoods';
import { usePagination } from '@/hooks/usePagination';
import { FinishedGood } from '@/lib/indexeddb';
import { FinishedGoodsLoadingScreen } from './FinishedGoodsLoadingScreen';

interface FinishedGoodsPageProps {
  className?: string;
}

export function FinishedGoodsPage({ className }: FinishedGoodsPageProps) {
  const {
    finishedGoods,
    categories,
    loading,
    error,
    syncStatus,
    lastSyncTime,
    recordCount,
    isInitializing,
    syncProgress,
    syncData,
    searchProducts,
    refreshData,
  } = useFinishedGoods();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<FinishedGood[]>([]);
  const [filteredData, setFilteredData] = useState<FinishedGood[]>([]);

  // Calculate filtered data when base data or filters change
  useEffect(() => {
    let result: FinishedGood[] = [];
    
    if (searchTerm && searchResults.length >= 0) {
      // If searching, use search results
      result = searchResults;
    } else if (selectedCategory) {
      // If category is selected, filter by category
      result = finishedGoods.filter(
        product => product.catname_value === selectedCategory
      );
    } else {
      // Show all products
      result = finishedGoods;
    }
    
    setFilteredData(result);
  }, [finishedGoods, searchResults, selectedCategory, searchTerm]);

  // Pagination hook with stable filtered data
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setItemsPerPage,
    hasNextPage,
    hasPreviousPage,
    getPageNumbers,
  } = usePagination({
    data: filteredData,
    itemsPerPage: 12, // Default items per page
    initialPage: 1,
  });

  const [displayedProducts, setDisplayedProducts] = useState<FinishedGood[]>([]);

  // Update displayed products when pagination changes
  useEffect(() => {
    setDisplayedProducts(paginatedData);
  }, [paginatedData]);

  // Handle search
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    goToPage(1); // Reset to first page when searching
    if (term.trim()) {
      const results = await searchProducts(term);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setSearchTerm(''); // Clear search when selecting category
    setSearchResults([]);
    goToPage(1); // Reset to first page when changing category
  };

  // Format sync time
  const formatSyncTime = (timeString: string | null) => {
    if (!timeString) return 'Never';
    return new Date(timeString).toLocaleString();
  };

  // Handle retry from loading screen
  const handleRetry = () => {
    syncData();
  };

  // Handle cancel from loading screen  
  const handleCancel = () => {
    // For now, just close the loading screen
    // In a real app, you might want to redirect or show an alternative view
  };

  return (
    <>
      {/* Loading Screen Overlay */}
      <FinishedGoodsLoadingScreen
        isVisible={isInitializing || syncStatus === 'syncing'}
        progress={syncProgress}
        error={error}
        onRetry={handleRetry}
        onCancel={handleCancel}
      />

      <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finished Goods</h1>
          <p className="text-muted-foreground">
            Manage and view finished goods inventory from iDempiere
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={syncData}
            disabled={syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Package className="h-4 w-4 mr-2" />
            )}
            Sync Data
          </Button>
        </div>
      </div>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{recordCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Sync</p>
              <p className="text-sm">{formatSyncTime(lastSyncTime)}</p>
              <Badge 
                variant={
                  syncStatus === 'success' ? 'default' :
                  syncStatus === 'error' ? 'destructive' :
                  syncStatus === 'syncing' ? 'secondary' : 'outline'
                }
              >
                {syncStatus === 'syncing' ? 'Syncing...' : 
                 syncStatus === 'success' ? 'Up to date' :
                 syncStatus === 'error' ? 'Sync failed' : 'Not synced'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or code..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => handleCategorySelect(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border rounded-md bg-background min-w-[200px]"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.product_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Items:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || selectedCategory) && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => handleSearch('')}>
                  Search: &quot;{searchTerm}&quot; ×
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => handleCategorySelect(null)}>
                  Category: {categories.find(c => c.id === selectedCategory)?.name} ×
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading finished goods...</span>
        </div>
      ) : displayedProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No finished goods data available. Click &quot;Sync Data&quot; to fetch from iDempiere.'
                }
              </p>
              {!searchTerm && !selectedCategory && recordCount === 0 && (
                <Button onClick={syncData} disabled={syncStatus === 'syncing'}>
                  <Package className="h-4 w-4 mr-2" />
                  Sync Data
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination and Results Summary */}
      {totalItems > 0 && (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{endIndex} of {totalItems.toLocaleString()} products
              {(searchTerm || selectedCategory) && (
                <span className="ml-1">
                  ({filteredData.length.toLocaleString()} filtered from {finishedGoods.length.toLocaleString()} total)
                </span>
              )}
            </div>
            
            {/* Page info */}
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={goToPreviousPage}
                    className={!hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === -1 ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => goToPage(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={goToNextPage}
                    className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
      </div>
    </>
  );
}

/**
 * Individual Product Card Component
 */
interface ProductCardProps {
  product: FinishedGood;
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold leading-tight">
              {product.product_name}
            </CardTitle>
            <CardDescription className="mt-1">
              {product.product_code}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {product.Weight} {product.smalluom}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium">{product.catname}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Parent:</span>
            <span>{product.parent1}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">UOM:</span>
            <span>{product.smalluom} / {product.biguom}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}