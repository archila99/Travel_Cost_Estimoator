from typing import Dict, Any
from app.models.vehicle import Vehicle


class CostEstimator:
    """Service for calculating fuel consumption and travel costs."""
    
    @staticmethod
    def calculate_fuel_consumption(
        distance_km: float,
        fuel_consumption_per_100km: float
    ) -> float:
        """
        Calculate fuel consumption for a given distance.
        
        Args:
            distance_km: Distance in kilometers
            fuel_consumption_per_100km: Vehicle's fuel consumption rate (liters per 100km)
            
        Returns:
            Fuel consumption in liters
        """
        fuel_used = (distance_km / 100) * fuel_consumption_per_100km
        return round(fuel_used, 2)
    
    @staticmethod
    def calculate_fuel_cost(
        fuel_used_liters: float,
        fuel_price_per_liter: float
    ) -> float:
        """
        Calculate total fuel cost.
        
        Args:
            fuel_used_liters: Amount of fuel used in liters
            fuel_price_per_liter: Price per liter of fuel
            
        Returns:
            Total fuel cost
        """
        cost = fuel_used_liters * fuel_price_per_liter
        return round(cost, 2)
    
    def estimate_trip_cost(
        self,
        distance_km: float,
        vehicle: Vehicle
    ) -> Dict[str, float]:
        """
        Calculate complete trip cost breakdown.
        
        Args:
            distance_km: Distance in kilometers
            vehicle: Vehicle model with fuel specifications
            
        Returns:
            Dictionary with fuel_used_liters and fuel_cost
        """
        fuel_used = self.calculate_fuel_consumption(
            distance_km=distance_km,
            fuel_consumption_per_100km=vehicle.fuel_consumption
        )
        
        fuel_cost = self.calculate_fuel_cost(
            fuel_used_liters=fuel_used,
            fuel_price_per_liter=vehicle.fuel_price
        )
        
        return {
            'fuel_used_liters': fuel_used,
            'fuel_cost': fuel_cost
        }


# Global estimator instance
cost_estimator = CostEstimator()
