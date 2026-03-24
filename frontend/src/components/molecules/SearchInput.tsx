import React from 'react';
import { Input } from '../atoms/Input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  isLoading,
}) => {
  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      iconLeft="fa-search"
      controlClassName={isLoading ? 'is-loading' : ''}
    />
  );
};
