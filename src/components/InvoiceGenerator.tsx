import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Edit, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  businessName: string;
  customerName: string;
  customerAddress: string;
  ownerAddress: string;
  ownerPhone: string;
  services: string[];
  items: InvoiceItem[];
  total: number;
}

const InvoiceGenerator = () => {
  const customerInvoiceRef = useRef<HTMLDivElement>(null);
  const ownerInvoiceRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(true);
  const { toast } = useToast();

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: '12345',
    date: new Date().toLocaleDateString('en-GB'),
    businessName: 'Jai shree ram glass house',
    customerName: '',
    customerAddress: '',
    ownerAddress: 'I-268 LIG COLONY HANUMAN CHOCK\nnear MIG Thana, INDORE',
    ownerPhone: '9303229587',
    services: ['ALUMINIUM WINDOW', 'DOMEL WINDOW', 'UPVC WINDOW', 'GLASS RAILING'],
    items: [
      {
        id: '1',
        description: 'ALUMINIUM SECTION WINDOW',
        quantity: 1,
        price: 1800,
        subtotal: 1800
      }
    ],
    total: 1800
  });

  const calculateTotal = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const updateInvoiceData = (field: keyof InvoiceData, value: any) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'price') {
            updatedItem.subtotal = updatedItem.quantity * updatedItem.price;
          }
          return updatedItem;
        }
        return item;
      });
      
      const newTotal = calculateTotal(updatedItems);
      
      return {
        ...prev,
        items: updatedItems,
        total: newTotal
      };
    });
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      price: 0,
      subtotal: 0
    };
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id: string) => {
    setInvoiceData(prev => {
      const newItems = prev.items.filter(item => item.id !== id);
      const newTotal = calculateTotal(newItems);
      return {
        ...prev,
        items: newItems,
        total: newTotal
      };
    });
  };

  const generatePDF = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) {
      toast({
        title: "Error",
        description: "Could not find invoice content to generate PDF",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Starting PDF generation for:', filename);
      
      // Show loading toast
      toast({
        title: "Generating PDF...",
        description: "Please wait while we create your PDF"
      });

      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true
      });

      console.log('Canvas created successfully');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      console.log('PDF created successfully, saving...');
      pdf.save(filename);
      
      toast({
        title: "Success!",
        description: `PDF ${filename} has been downloaded`
      });
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const InvoiceTemplate = ({ type, ref }: { type: 'customer' | 'owner', ref: React.RefObject<HTMLDivElement> }) => (
    <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-black">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">{invoiceData.businessName}</h1>
          <p className="text-sm text-gray-600">{invoiceData.date}</p>
          <p className="text-sm text-gray-600">Invoice No. {invoiceData.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <ul className="space-y-1">
            {invoiceData.services.map((service, index) => (
              <li key={index} className="text-sm font-medium">• {service}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold text-lg mb-2">BILL TO:</h3>
          <div className="border-b border-black pb-2 mb-4">
            <p className="whitespace-pre-line">{invoiceData.customerName}</p>
            <p className="whitespace-pre-line text-sm mt-2">{invoiceData.customerAddress}</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="font-bold text-lg mb-2">PROPRIETAR:</h3>
          <p className="font-bold">HEMANT DUBEY</p>
          <p className="font-bold text-lg">{invoiceData.ownerPhone}</p>
          <p className="text-sm mt-2 whitespace-pre-line">{invoiceData.ownerAddress}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-4 gap-4 border-b-2 border-black pb-2 mb-4">
          <div className="font-bold">DESCRIPTION</div>
          <div className="font-bold text-center">PRICE</div>
          <div className="font-bold text-center">QTY</div>
          <div className="font-bold text-right">SUBTOTAL</div>
        </div>
        
        {invoiceData.items.map((item) => (
          <div key={item.id} className="grid grid-cols-4 gap-4 py-2 border-b border-gray-300">
            <div>
              <p className="font-medium">{item.description}</p>
              <p className="text-sm text-gray-600">{item.quantity} PCS.</p>
            </div>
            <div className="text-center">{item.price}</div>
            <div className="text-center">{item.quantity}</div>
            <div className="text-right font-medium">{item.subtotal}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h3 className="font-bold text-lg">SUBTOTAL</h3>
        </div>
        <div className="text-right">
          <h3 className="font-bold text-lg">TOTALS</h3>
          <div className="text-3xl font-bold mt-2">{invoiceData.total}</div>
        </div>
      </div>

      {type === 'owner' && (
        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h4 className="font-bold text-sm text-red-600 mb-2">OWNER COPY - INTERNAL USE ONLY</h4>
          <p className="text-xs text-gray-600">This copy is for business records and accounting purposes.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Invoice Generator</h1>
          <p className="text-lg text-gray-600">Create professional invoices with PDF export</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => updateInvoiceData('invoiceNumber', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  value={invoiceData.date}
                  onChange={(e) => updateInvoiceData('date', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={invoiceData.businessName}
                  onChange={(e) => updateInvoiceData('businessName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={invoiceData.customerName}
                  onChange={(e) => updateInvoiceData('customerName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="customerAddress">Customer Address</Label>
                <Textarea
                  id="customerAddress"
                  value={invoiceData.customerAddress}
                  onChange={(e) => updateInvoiceData('customerAddress', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Invoice Items</Label>
                {invoiceData.items.map((item) => (
                  <div key={item.id} className="border p-3 rounded space-y-2">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Subtotal: ₹{item.subtotal}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button onClick={addItem} variant="outline" className="w-full">
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => generatePDF(customerInvoiceRef, `invoice-${invoiceData.invoiceNumber}-customer.pdf`)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Customer PDF
              </Button>
              <Button
                onClick={() => generatePDF(ownerInvoiceRef, `invoice-${invoiceData.invoiceNumber}-owner.pdf`)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Owner PDF
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Customer Invoice Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InvoiceTemplate type="customer" ref={customerInvoiceRef} />
              </CardContent>
            </Card>

            <div className="hidden">
              <InvoiceTemplate type="owner" ref={ownerInvoiceRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
