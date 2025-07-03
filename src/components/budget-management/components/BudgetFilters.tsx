import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BudgetFilters as BudgetFiltersType } from '../BudgetManagementPage';

interface BudgetFiltersProps {
  filters: BudgetFiltersType;
  onFiltersChange: (filters: BudgetFiltersType) => void;
}

export const BudgetFilters: React.FC<BudgetFiltersProps> = ({ filters, onFiltersChange }) => {
  const updateFilter = (key: keyof BudgetFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-card p-4 rounded-lg border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search item, description, amount..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={filters.type} onValueChange={(value) => updateFilter('type', value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {filters.category === 'expense' ? (
                <>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="meals">Meals</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </>
              ) : filters.category === 'income' ? (
                <>
                  <SelectItem value="fundraiser">Fundraiser</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="meals">Meals</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="fundraiser">Fundraiser</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="payment-method">Payment Method</Label>
          <Select value={filters.paymentMethod} onValueChange={(value) => updateFilter('paymentMethod', value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="debit_card">Debit Card</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="not_paid">Not Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="show-archived"
            checked={filters.showArchived}
            onCheckedChange={(checked) => updateFilter('showArchived', checked)}
          />
          <Label htmlFor="show-archived">Show Archived</Label>
        </div>
      </div>
    </div>
  );
};