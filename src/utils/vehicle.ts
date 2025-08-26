
export const formatMonthDisplay = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${monthNames[monthIndex]} ${year}`;
};

export const getTripsForMonth = (vehicleLogs: any[], monthKey: string) => {
  return vehicleLogs.filter(log => {
    const logDate = new Date(log.date);
    const year = logDate.getFullYear();
    const month = (logDate.getMonth() + 1).toString().padStart(2, '0');
    const logMonthKey = `${year}-${month}`;
    return logMonthKey === monthKey;
  });
};

export const calculateMonthlyData = (
  trackingMode: string,
  monthlySummaries: any[],
  vehicleLogs: any[],
  deductionMethod: string,
  perKmRate: number
) => {
  if (trackingMode === "monthly") {
    return monthlySummaries.map(summary => ({
      month: new Date(summary.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      businessKm: summary.business_km,
      method: deductionMethod,
      deduction: deductionMethod === "per_km" ? summary.business_km * perKmRate : 0,
      id: summary.id,
      type: "monthly" as const,
      trips: []
    }));
  } else {
    const monthlyGroups: { [key: string]: number } = {};
    
    vehicleLogs.forEach(log => {
      const logDate = new Date(log.date);
      const year = logDate.getFullYear();
      const month = (logDate.getMonth() + 1).toString().padStart(2, '0');
      const monthKey = `${year}-${month}`;
      
      console.log('Processing log:', { date: log.date, logDate, monthKey, distance: log.distance_km });
      
      monthlyGroups[monthKey] = (monthlyGroups[monthKey] || 0) + log.distance_km;
    });

    console.log('Monthly groups:', monthlyGroups);

    return Object.entries(monthlyGroups).map(([month, businessKm]) => ({
      month: formatMonthDisplay(month),
      businessKm,
      method: deductionMethod,
      deduction: deductionMethod === "per_km" ? businessKm * perKmRate : 0,
      id: month,
      type: "trip" as const,
      trips: getTripsForMonth(vehicleLogs, month)
    })).sort((a, b) => b.id.localeCompare(a.id));
  }
};
