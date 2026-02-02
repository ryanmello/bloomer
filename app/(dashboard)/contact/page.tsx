"use client";
import React from 'react';
import { useState, useMemo } from 'react';
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Filter, X } from "lucide-react";
import { motion } from "framer-motion";

interface Contact {
  // Primary ID - MongoDB ObjectId (string format, matches rest of codebase)
  id: string;
  
  // Alternative identifiers
  email: string; // Can be used as unique identifier (like Customer model)
  phone: string;
  
  // Contact information
  name: string;
  status: 'Active' | 'Inactive';
  image?: string; // Profile picture URL
  
  // Optional external system IDs (like squareId in Customer model)
  externalId?: string; // For integration with external systems
  squareId?: string; // If using Square integration
  
  // Timestamps (matching other models in codebase)
  createdAt?: string | Date;
  updatedAt?: string | Date;
  
  // Additional optional fields
  notes?: string;
  tags?: string[]; // For categorization/filtering
}

type ContactStatus = 'Active' | 'Inactive' | 'All';

export default function Contact() {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "CONTACT001", name: "Sarah Lopez", email: "sarah.lopez@gmail.com", phone: "555-1234", status: "Active" },
    { id: "CONTACT002", name: "David Kim", email: "david.kim@yahoo.com", phone: "555-5678", status: "Inactive" },
    { id: "CONTACT003", name: "Emily Zhang", email: "emily.zhang@outlook.com", phone: "555-9012", status: "Active" },
    { id: "CONTACT004", name: "James Rivera", email: "james.rivera@gmail.com", phone: "555-3456", status: "Active" },
    { id: "CONTACT005", name: "Maria Garcia", email: "maria.garcia@yahoo.com", phone: "555-7890", status: "Inactive" },
  ]);

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || "?";
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus>("All");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Filter contacts based on search query and status
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        contact.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || contact.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contacts, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700";
      case "Inactive":
        return "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:ring-gray-700";
      default:
        return "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:ring-gray-700";
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (contactToDelete) {
      // Remove the contact from the state
      setContacts((prevContacts) =>
        prevContacts.filter((contact) => contact.id !== contactToDelete.id)
      );
      
      // If the deleted contact was being viewed, close the view dialog
      if (selectedContact?.id === contactToDelete.id) {
        setIsViewDialogOpen(false);
        setSelectedContact(null);
      }
      
      // Close the delete dialog and reset
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "All";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground">View, manage, and organize your contact list</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Contact
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, phone, or ID" 
            className="pl-10 bg-background border-border text-foreground" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ContactStatus)}>
          <SelectTrigger className="w-[180px] bg-background border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setIsFilterDialogOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Contacts Table */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Contact List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">Contact ID</TableHead>
                  <TableHead className="text-foreground">Name</TableHead>
                  <TableHead className="text-foreground">Email</TableHead>
                  <TableHead className="text-foreground">Phone</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-right text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No contacts found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => {
                    const initials = getInitials(contact.name);
                    return (
                      <TableRow key={contact.id} className="border-border hover:bg-muted/30">
                        <TableCell className="text-foreground font-mono text-sm">{contact.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              {contact.image ? (
                                <Image
                                  src={contact.image}
                                  alt={contact.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center text-sm font-semibold text-foreground">
                                  {initials}
                                </div>
                              )}
                            </div>
                            <span className="text-foreground">{contact.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{contact.email}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.phone}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                            contact.status
                          )}`}
                        >
                          {contact.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewContact(contact)}
                        >
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteClick(contact)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Contact Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>
              View detailed information about this contact
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              {/* Profile Picture and Name Section */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="relative flex-shrink-0">
                  {selectedContact.image ? (
                    <Image
                      src={selectedContact.image}
                      alt={selectedContact.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted/50 border border-border flex items-center justify-center text-lg font-semibold text-foreground">
                      {getInitials(selectedContact.name)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedContact.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact ID</p>
                  <p className="text-foreground font-mono text-sm">{selectedContact.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-foreground">{selectedContact.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                      selectedContact.status
                    )}`}
                  >
                    {selectedContact.status}
                  </span>
                </div>
                {selectedContact.squareId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Square ID</p>
                    <p className="text-foreground font-mono text-sm">{selectedContact.squareId}</p>
                  </div>
                )}
                {selectedContact.externalId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">External ID</p>
                    <p className="text-foreground font-mono text-sm">{selectedContact.externalId}</p>
                  </div>
                )}
                {selectedContact.createdAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <p className="text-foreground text-sm">
                      {new Date(selectedContact.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedContact.updatedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                    <p className="text-foreground text-sm">
                      {new Date(selectedContact.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedContact.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                  <p className="text-foreground">{selectedContact.notes}</p>
                </div>
              )}
              {selectedContact.tags && selectedContact.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-muted text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete contact{" "}
              <span className="font-semibold text-foreground">
                {contactToDelete?.name}
              </span>
              {" "}({contactToDelete?.id})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContactToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Contacts</DialogTitle>
            <DialogDescription>
              Apply filters to narrow down your contact list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Status
              </label>
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value as ContactStatus)}
              >
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Search
              </label>
              <Input
                placeholder="Search by name, email, phone, or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
            <Button onClick={() => setIsFilterDialogOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
