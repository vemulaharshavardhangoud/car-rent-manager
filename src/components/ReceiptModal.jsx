import React, { useState, useEffect } from 'react';
import { Car, X, Printer, Download, Save, PlusCircle } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, tripData, onSave, onNewTrip }) => {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen || !tripData) return null;

  const handleSave = () => {
    onSave();
    setIsSaved(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-0 md:p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white w-full max-w-3xl rounded-none md:rounded-2xl shadow-2xl flex flex-col print:shadow-none print:my-0 print:rounded-none h-full md:h-auto md:max-h-[90vh]">
        
        {/* MODAL HEADER (Hidden on print) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 print:hidden bg-white rounded-t-2xl z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">Review Trip Receipt</h2>
          </div>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto print:overflow-visible">
          <div className="p-8 pt-12 md:pt-16 print:p-4 receipt-content" id="printable-receipt">
          
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="bg-blue-600 p-2 rounded-lg print:bg-transparent print:border-2 print:border-blue-600 print:text-blue-600 text-white">
                <Car className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-wider text-gray-900">CarRent Manager</h1>
            </div>
            <h2 className="text-3xl font-black uppercase text-gray-800 tracking-widest mt-4">Trip Receipt</h2>
            <div className="flex justify-between items-center mt-6 text-sm text-gray-600 font-mono">
              <span className="font-bold border border-gray-300 px-3 py-1 rounded bg-gray-50">NO: {tripData.receiptNumber}</span>
              <span>Date: {new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Vehicle Info */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 print:bg-transparent print:border-gray-300">
              <h3 className="text-xs font-bold uppercase text-blue-800 tracking-wider mb-3 print:text-gray-800">Vehicle Details</h3>
              <div className="space-y-2 text-sm text-gray-800">
                <p><span className="text-gray-500 w-24 inline-block font-medium">Name:</span> <span className="font-bold">{tripData.vehicleName}</span></p>
                <p><span className="text-gray-500 w-24 inline-block font-medium">Number Plate:</span> <span className="font-mono font-bold bg-white px-1.5 py-0.5 border border-gray-200 rounded print:border-none print:px-0">{(tripData.numberPlate || '').toUpperCase()}</span></p>
                <p><span className="text-gray-500 w-24 inline-block font-medium">Type:</span> <span className="font-medium">{tripData.vehicleType}</span></p>
                <p><span className="text-gray-500 w-24 inline-block font-medium">Seating:</span> <span className="font-medium">{tripData.capacity} Seats</span></p>
              </div>
            </div>

            {/* Trip Info */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
              <h3 className="text-xs font-bold uppercase text-gray-700 tracking-wider mb-3">Journey Details</h3>
              <div className="space-y-2 text-sm text-gray-800">
                <p><span className="text-gray-500 w-24 inline-block font-medium">Start:</span> <span className="font-semibold">{tripData.date} {tripData.startTime}</span></p>
                <p><span className="text-gray-500 w-24 inline-block font-medium">End:</span> <span className="font-semibold">{tripData.endDate} {tripData.endTime}</span></p>
                <p><span className="text-gray-500 w-24 inline-block font-medium">Route:</span> <span className="font-semibold">{tripData.from} → {tripData.to}</span></p>
                <p><span className="text-gray-500 w-24 inline-block font-medium">Duration:</span> <span className="font-semibold">{tripData.days || tripData.numberOfDays} Day(s)</span></p>
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <p><span className="text-gray-500 w-24 inline-block font-medium">Start Odo:</span> <span className="font-mono">{tripData.startOdo || tripData.startKm} KM</span></p>
                  <p><span className="text-gray-500 w-24 inline-block font-medium">End Odo:</span> <span className="font-mono">{tripData.endOdo || tripData.endKm} KM</span></p>
                  <p className="mt-1"><span className="text-gray-500 w-24 inline-block font-bold">Total Dist:</span> <span className="font-bold text-blue-700 print:text-gray-900">{tripData.distance} KM</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {(tripData.customerName || tripData.customerPhone || tripData.purposeOfTrip) && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 mb-8">
              <h3 className="text-xs font-bold uppercase text-gray-700 tracking-wider mb-3">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {tripData.customerName && <p><span className="text-gray-500 block text-xs">Name</span><span className="font-semibold">{tripData.customerName}</span></p>}
                {tripData.customerPhone && <p><span className="text-gray-500 block text-xs">Phone</span><span className="font-semibold">{tripData.customerPhone}</span></p>}
                {tripData.purposeOfTrip && <p><span className="text-gray-500 block text-xs">Purpose</span><span className="font-semibold">{tripData.purposeOfTrip}</span></p>}
              </div>
            </div>
          )}

          {/* Cost Breakdown */}
          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase text-gray-700 tracking-wider mb-3">Cost Breakdown</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden print:border-gray-400">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                  <tr className="bg-gray-50/50 print:bg-transparent">
                    <td className="py-3 px-4 font-medium text-gray-800">Base Rent</td>
                    <td className="py-3 px-4 text-gray-500 text-right font-mono text-xs">
                      {tripData.billingMode === 'KM' 
                        ? `${tripData.distance} km × ₹${tripData.ratePerKm}/km`
                        : `${tripData.days || tripData.numberOfDays} days × ₹${tripData.ratePerDay}/day`}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">₹{tripData.baseRent}</td>
                  </tr>
                  
                  {tripData.fuelCost > 0 && (
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-800">Fuel Cost <span className="text-xs text-gray-400 font-normal italic ml-1">(Excluded from total)</span></td>
                      <td className="py-3 px-4 text-gray-500 text-right font-mono text-xs">
                        {tripData.fuelLitres || tripData.litresFilled} litres × ₹{tripData.fuelPrice || tripData.pricePerLitre}/L
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">₹{tripData.fuelCost}</td>
                    </tr>
                  )}
                  
                  {tripData.tollTax > 0 && (
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-800">Toll Tax</td>
                      <td className="py-3 px-4 text-gray-500 text-right"></td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">₹{tripData.tollTax}</td>
                    </tr>
                  )}
                  
                  {tripData.borderTax > 0 && (
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-800">Border Tax</td>
                      <td className="py-3 px-4 text-gray-500 text-right"></td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">₹{tripData.borderTax}</td>
                    </tr>
                  )}
                  
                  {tripData.driverAllowance > 0 && (
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-800">Driver Allowance</td>
                      <td className="py-3 px-4 text-gray-500 text-right"></td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">₹{tripData.driverAllowance}</td>
                    </tr>
                  )}
                  
                  {tripData.otherCharges > 0 && (
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-800">{tripData.otherChargesLabel || 'Other Charges'}</td>
                      <td className="py-3 px-4 text-gray-500 text-right"></td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">₹{tripData.otherCharges}</td>
                    </tr>
                  )}
                  
                  <tr className="bg-gray-50 border-t-2 border-dashed border-gray-300 print:border-gray-400 print:bg-transparent">
                    <td colSpan="2" className="py-5 px-4 font-black text-lg text-gray-800 uppercase tracking-widest text-right">Grand Total</td>
                    <td className="py-5 px-4 text-right font-black text-2xl text-green-600 print:text-gray-900">₹{tripData.grandTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 text-center text-sm font-semibold text-gray-600">
            <div>
              <div className="border-t border-gray-400 pt-2 mb-1">Driver Signature</div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2 mb-1">Customer Signature</div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2 mb-1">Authorized By</div>
            </div>
          </div>
          
          </div>
        </div>
        
        {/* MODAL FOOTER BUTTONS (Hidden on print) */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl print:hidden flex flex-wrap gap-4 justify-between items-center shrink-0">
          
          <div className="flex gap-3">
             <button
               onClick={onClose}
               className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
             >
               <X className="w-4 h-4" /> Go Back
             </button>
             
             <button
               onClick={onNewTrip}
               className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
             >
               <PlusCircle className="w-4 h-4" /> New Trip
             </button>
             
             <button
               onClick={handlePrint}
               className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
             >
               <Download className="w-4 h-4" /> Download PDF
             </button>
          </div>
          
          <div className="flex gap-3">
            <button
               onClick={handlePrint}
               className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
             >
               <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button
               onClick={handleSave}
               disabled={isSaved}
               className={`px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors ${isSaved ? 'bg-green-100 text-green-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-md'}`}
             >
               <Save className="w-4 h-4" /> {isSaved ? 'Saved ✓' : 'Save Trip'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
