
interface VehicleExpenseSummaryProps {
  monthlyData: any[];
  trackingMode: string;
}

const VehicleExpenseSummary = ({ monthlyData, trackingMode }: VehicleExpenseSummaryProps) => {
  if (monthlyData.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No vehicle data yet. Start by {trackingMode === "trip" ? "logging trips" : "adding monthly summaries"}.
      </div>
    );
  }

  const totalKm = monthlyData.reduce((sum, row) => sum + row.businessKm, 0);
  const totalDeduction = monthlyData.reduce((sum, row) => sum + row.deduction, 0);

  return (
    <div className="p-4 bg-muted/25 border-t">
      <div className="grid grid-cols-5 gap-4 font-medium text-sm">
        <div>Total</div>
        <div>{totalKm.toFixed(1)} km</div>
        <div></div>
        <div className="text-primary">${totalDeduction.toFixed(2)}</div>
        <div></div>
      </div>
    </div>
  );
};

export default VehicleExpenseSummary;
