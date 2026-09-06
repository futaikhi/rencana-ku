import React from "react";
import {
  HeartHandshake,
  Home,
  Plane,
  Car,
  GraduationCap,
  Hammer,
  Rocket,
  Target,
  Sparkles,
  Compass,
  Briefcase,
  BookOpen,
  Calendar,
  Layers,
  MapPin,
  Smile,
  LucideProps,
} from "lucide-react";

interface CategoryIconProps extends LucideProps {
  name?: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, size = 20, className = "", ...props }) => {
  switch (name) {
    case "HeartHandshake":
    case "Wedding":
      return <HeartHandshake size={size} className={className} {...props} />;
    case "Home":
    case "House":
      return <Home size={size} className={className} {...props} />;
    case "Plane":
    case "Vacation":
      return <Plane size={size} className={className} {...props} />;
    case "Car":
      return <Car size={size} className={className} {...props} />;
    case "GraduationCap":
    case "Education":
      return <GraduationCap size={size} className={className} {...props} />;
    case "Hammer":
    case "Renovation":
      return <Hammer size={size} className={className} {...props} />;
    case "Rocket":
    case "Business":
      return <Rocket size={size} className={className} {...props} />;
    case "Target":
    case "Personal":
      return <Target size={size} className={className} {...props} />;
    case "Compass":
      return <Compass size={size} className={className} {...props} />;
    case "Briefcase":
      return <Briefcase size={size} className={className} {...props} />;
    case "BookOpen":
      return <BookOpen size={size} className={className} {...props} />;
    case "Calendar":
      return <Calendar size={size} className={className} {...props} />;
    case "Layers":
      return <Layers size={size} className={className} {...props} />;
    case "MapPin":
      return <MapPin size={size} className={className} {...props} />;
    case "Smile":
      return <Smile size={size} className={className} {...props} />;
    case "Sparkles":
    default:
      return <Sparkles size={size} className={className} {...props} />;
  }
};
