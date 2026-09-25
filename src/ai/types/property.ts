export type PublicProperty = {
  id: number;
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: number;
  furnishing: string;
  furnishingDetails: string | null;
  areaSqFt: number;
  vastu: string | null;
  availableFrom: string;
  societyName: string;
  description: string | null;
  media: {
    id: number;
    type: string;
    secureUrl: string;
    position: number;
  }[];
  createdAt: Date;
};