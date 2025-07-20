import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';

interface PropertyValue {
  id: number;
  name: string;
  value: number;
}

const PropertyUpdateDialog = ({
  isOpen,
  onClose,
  title,
  currentValue,
  propertyType,
  onUpdate,
  commonAPIRequest,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentValue: number | null;
  propertyType: string;
  onUpdate: (value: number) => void;
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [values, setValues] = useState<PropertyValue[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyValues = useCallback(() => {
    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.repository.getRepositoryPropertyValue;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest<PropertyValue[]>(
      {
        api: `${apiUrl}${propertyType}`,
        method: 'GET',
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setValues(response);
          // Set the initial selected value based on current value
          const currentOption = response.find((v) => v.value === currentValue);
          if (currentOption) {
            setSelectedId(currentOption.id);
          }
        }
      }
    );
  }, [propertyType, currentValue, commonAPIRequest]);

  useEffect(() => {
    if (isOpen) {
      fetchPropertyValues();
    }
  }, [isOpen, fetchPropertyValues]);

  // Get the selected value for the update operation
  const getSelectedValue = () => {
    const selectedOption = values.find((v) => v.id === selectedId);
    return selectedOption?.value || currentValue;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update {title}</DialogTitle>
          <DialogDescription>
            Change the value of this property. This will update the risk score accordingly.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-4">
              {values.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={selectedId === option.id ? 'default' : 'outline'}
                  className={`w-full justify-start gap-2 ${
                    selectedId === option.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedId(option.id)}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      option.value >= 0.75
                        ? 'bg-red-500'
                        : option.value >= 0.5
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                  />
                  {option.name}
                  {selectedId === option.id && <Check className="h-4 w-4 ml-auto" />}
                </Button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedId) {
                onUpdate(selectedId);
                onClose();
              }
            }}
            disabled={
              isLoading ||
              !selectedId ||
              values.find((v) => v.id === selectedId)?.value === currentValue
            }
          >
            Update Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(PropertyUpdateDialog);
