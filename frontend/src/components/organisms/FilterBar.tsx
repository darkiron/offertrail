import React from 'react';
import { SearchInput } from '../molecules/SearchInput';
import { Select } from '../atoms/Select';
import { Button } from '../atoms/Button';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: { value: string; label: string }[];
  onReset?: () => void;
  isLoading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions,
  onReset,
  isLoading,
}) => {
  return (
    <div className="level">
      <div className="level-left">
        <div className="level-item">
          <SearchInput 
            value={search} 
            onChange={onSearchChange} 
            placeholder="Search applications..." 
            isLoading={isLoading}
          />
        </div>
        <div className="level-item">
          <Select 
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            options={statusOptions}
          />
        </div>
        {onReset && (
          <div className="level-item">
            <Button variant="light" onClick={onReset}>Reset</Button>
          </div>
        )}
      </div>
    </div>
  );
};
