import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, User, Image, X } from 'lucide-react';
import type { CreatePersonInput } from '../../../server/src/schema';

interface PersonFormProps {
  onSubmit: (data: CreatePersonInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PersonForm({ onSubmit, onCancel, isLoading = false }: PersonFormProps) {
  const [formData, setFormData] = useState<CreatePersonInput>({
    full_name: '',
    birth_date: null,
    death_date: null,
    photo_url: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (formData.photo_url && formData.photo_url.trim()) {
      try {
        new URL(formData.photo_url);
      } catch {
        newErrors.photo_url = 'Please enter a valid URL';
      }
    }

    if (formData.birth_date && formData.death_date) {
      if (formData.birth_date > formData.death_date) {
        newErrors.death_date = 'Death date cannot be before birth date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        full_name: '',
        birth_date: null,
        death_date: null,
        photo_url: null
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to submit person form:', error);
    }
  };

  const handleDateChange = (field: 'birth_date' | 'death_date', value: string) => {
    setFormData((prev: CreatePersonInput) => ({
      ...prev,
      [field]: value ? new Date(value) : null
    }));
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <Card className="border-2 border-blue-100">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Add New Family Member
            </h3>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Full Name */}
            <div className="md:col-span-2">
              <Label htmlFor="full_name" className="text-sm font-medium">
                Full Name *
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePersonInput) => ({ 
                    ...prev, 
                    full_name: e.target.value 
                  }))
                }
                placeholder="Enter full name"
                className={errors.full_name ? 'border-red-500' : ''}
                required
              />
              {errors.full_name && (
                <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* Birth Date */}
            <div>
              <Label htmlFor="birth_date" className="text-sm font-medium flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Birth Date
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formatDateForInput(formData.birth_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleDateChange('birth_date', e.target.value)
                }
                max={new Date().toISOString().split('T')[0]} // Can't be in the future
              />
            </div>

            {/* Death Date */}
            <div>
              <Label htmlFor="death_date" className="text-sm font-medium flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Death Date
              </Label>
              <Input
                id="death_date"
                type="date"
                value={formatDateForInput(formData.death_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleDateChange('death_date', e.target.value)
                }
                max={new Date().toISOString().split('T')[0]} // Can't be in the future
                className={errors.death_date ? 'border-red-500' : ''}
              />
              {errors.death_date && (
                <p className="text-sm text-red-600 mt-1">{errors.death_date}</p>
              )}
            </div>

            {/* Photo URL */}
            <div className="md:col-span-2">
              <Label htmlFor="photo_url" className="text-sm font-medium flex items-center gap-1">
                <Image className="h-3 w-3" />
                Photo URL
              </Label>
              <Input
                id="photo_url"
                type="url"
                value={formData.photo_url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePersonInput) => ({ 
                    ...prev, 
                    photo_url: e.target.value || null 
                  }))
                }
                placeholder="https://example.com/photo.jpg"
                className={errors.photo_url ? 'border-red-500' : ''}
              />
              {errors.photo_url && (
                <p className="text-sm text-red-600 mt-1">{errors.photo_url}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Optional: Enter a URL to a photo of this person
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Adding...' : '👨‍👩‍👧‍👦 Add Family Member'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}