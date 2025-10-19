"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Customer {
  id: string;
  squareId?: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  //Fetch customers from api
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      const data: Customer[] = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchCustomers();
  }, []);

  //UI components
  return (
    <div className="p-6 space-y-6">
      
      {customers.length === 0 && !loading && <p>No customers found.</p>}

      {/* Customer Cards */}
      {customers.map((customer) => (
        <Card key={customer.id} className="w-full p-6 shadow-md">
          <CardHeader>
            <CardTitle>{customer.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-gray-300 text-sm md:text-base">
              <div className="min-w-[150px]"><strong>Email:</strong> {customer.email || "-"}</div>
              <div className="min-w-[150px]"><strong>Phone:</strong> {customer.phone || "-"}</div>
              <div className="min-w-[150px]"><strong>Location:</strong> {customer.location || "-"}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}