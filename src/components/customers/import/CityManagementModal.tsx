'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateSaudiCity, getSaudiCities, addSaudiCity } from '@/lib/id-generator';

interface CityManagementModalProps {
  isOpen: boolean;
  unrecognizedCity: string;
  suggestions: string[];
  onCityResolved: (originalCity: string, resolvedCity: string) => void;
  onCancel: () => void;
}

export function CityManagementModal({
  isOpen,
  unrecognizedCity,
  suggestions,
  onCityResolved,
  onCancel
}: CityManagementModalProps) {
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new'>('existing');
  const [selectedCity, setSelectedCity] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newCityCode, setNewCityCode] = useState('');
  const [error, setError] = useState('');

  const saudiCities = getSaudiCities();

  useEffect(() => {
    if (isOpen && suggestions.length > 0) {
      setSelectedCity(suggestions[0]);
    }
  }, [isOpen, suggestions]);

  const handleResolve = () => {
    setError('');

    if (selectedOption === 'existing') {
      if (!selectedCity) {
        setError('يرجى اختيار مدينة من القائمة');
        return;
      }
      onCityResolved(unrecognizedCity, selectedCity);
    } else {
      if (!newCityName.trim()) {
        setError('يرجى إدخال اسم المدينة');
        return;
      }
      if (!newCityCode.trim()) {
        setError('يرجى إدخال رمز المدينة');
        return;
      }
      if (newCityCode.length !== 3) {
        setError('رمز المدينة يجب أن يكون 3 أحرف');
        return;
      }
      
      // Check if city code already exists
      const existingCity = saudiCities.find(city => city.code === newCityCode.toUpperCase());
      if (existingCity) {
        setError(`رمز المدينة ${newCityCode.toUpperCase()} مستخدم بالفعل للمدينة ${existingCity.name}`);
        return;
      }

      // Add the new city to the database
      const success = addSaudiCity(newCityName.trim(), newCityCode.toUpperCase());
      if (!success) {
        setError('فشل في إضافة المدينة الجديدة');
        return;
      }

      onCityResolved(unrecognizedCity, newCityName.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-right">
            إدارة المدينة غير المعترف بها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              المدينة "{unrecognizedCity}" غير معترف بها في النظام.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Option 1: Use existing city */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="radio"
                  id="existing"
                  name="option"
                  value="existing"
                  checked={selectedOption === 'existing'}
                  onChange={(e) => setSelectedOption(e.target.value as 'existing')}
                />
                <Label htmlFor="existing">استخدام مدينة موجودة</Label>
              </div>
              
              {selectedOption === 'existing' && (
                <div className="mr-6">
                  <Label htmlFor="citySelect">اختر المدينة:</Label>
                  <select
                    id="citySelect"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    dir="rtl"
                  >
                    <option value="">اختر مدينة</option>
                    {suggestions.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Option 2: Add new city */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="radio"
                  id="new"
                  name="option"
                  value="new"
                  checked={selectedOption === 'new'}
                  onChange={(e) => setSelectedOption(e.target.value as 'new')}
                />
                <Label htmlFor="new">إضافة مدينة جديدة</Label>
              </div>
              
              {selectedOption === 'new' && (
                <div className="mr-6 space-y-3">
                  <div>
                    <Label htmlFor="newCityName">اسم المدينة:</Label>
                    <Input
                      id="newCityName"
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                      placeholder="مثال: رابغ"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCityCode">رمز المدينة (3 أحرف):</Label>
                    <Input
                      id="newCityCode"
                      value={newCityCode}
                      onChange={(e) => setNewCityCode(e.target.value.toUpperCase())}
                      placeholder="مثال: RAB"
                      maxLength={3}
                      className="font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <Button onClick={handleResolve}>
              حل المشكلة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 