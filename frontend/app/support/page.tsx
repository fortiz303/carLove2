"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Home,
  Calendar,
  Plus,
  MessageCircle,
  User,
  ChevronUp,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import SupportTicketDialog from "@/components/SupportTicketDialog";
import SupportTicketList from "@/components/SupportTicketList";
import SupportTicketDetail from "@/components/SupportTicketDetail";
import { SupportTicket } from "@/lib/api";
import PrimaryLayout from "@/components/layout/primary";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
}

interface MockSupportTicket {
  id: string;
  ticketNumber: string;
  issue: string;
  status: "resolved" | "in-progress" | "pending";
  date: string;
}

export default function SupportPage() {
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [refreshTickets, setRefreshTickets] = useState(0);

  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: "1",
      question: "How Do I Book A Service?",
      answer: "Log in, choose service, pick time, confirm booking.",
      isOpen: true,
    },
    {
      id: "2",
      question: "What If I Need To Cancel?",
      answer:
        "You can cancel your booking up to 2 hours before the scheduled time through the app or by contacting support.",
      isOpen: false,
    },
    {
      id: "3",
      question: "What Areas Do You Serve?",
      answer:
        "We currently serve the greater metropolitan area within a 25-mile radius of the city center. Check our coverage map in the app for specific locations.",
      isOpen: false,
    },
    {
      id: "4",
      question: "Is Payment Upfront?",
      answer:
        "Payment is processed after service completion. We accept all major credit cards, digital wallets, and cash payments.",
      isOpen: false,
    },
  ]);

  const mockSupportTickets: MockSupportTicket[] = [
    {
      id: "1",
      ticketNumber: "20143",
      issue: "Booking Issue",
      status: "resolved",
      date: "Dec 10, 2024",
    },
    {
      id: "2",
      ticketNumber: "19432",
      issue: "Payment Not Processed",
      status: "in-progress",
      date: "Dec 8, 2024",
    },
    {
      id: "3",
      ticketNumber: "18765",
      issue: "Technician No-Show",
      status: "resolved",
      date: "Dec 5, 2024",
    },
  ];

  const toggleFAQ = (id: string) => {
    setFaqs(
      faqs.map((faq) =>
        faq.id === id
          ? { ...faq, isOpen: !faq.isOpen }
          : { ...faq, isOpen: false }
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "text-green-600";
      case "in-progress":
        return "text-yellow-600";
      case "pending":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-3 h-3" />;
      case "in-progress":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const handleTicketCreated = () => {
    setRefreshTickets((prev) => prev + 1);
  };

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDetail(true);
  };

  const handleTicketUpdated = () => {
    setRefreshTickets((prev) => prev + 1);
  };

  return (
    <PrimaryLayout>
      {/* Mobile Status Bar */}
      {/* <div className="flex justify-between items-center px-4 py-2 text-white text-sm font-medium md:hidden bg-green-700">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white/60 rounded-full"></div>
          </div>
          <div className="ml-2 text-xs">📶 📶 📶</div>
          <div className="ml-1 text-xs">🔋</div>
        </div>
      </div> */}

      {/* Header */}
      <div className="bg-green-900 px-4 py-8 md:px-8 md:py-12">
        <div className="max-w-md mx-auto ">
          <h1 className="text-white text-2xl font-bold mb-2">Help & Support</h1>
          <p className="text-white/90 text-sm">
            Get Answers Or Contact Us Instantly.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 md:px-8 max-w-md mx-auto space-y-6">
        {/* FAQ Section */}
        <div className="bg-white rounded-2xl py-4 px-3">
          <h2 className="text-lg font-semibold mb-3 px-1">FAQ’s</h2>
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-gray-800 rounded-xl mb-2 overflow-hidden"
            >
              <Collapsible
                open={faq.isOpen}
                onOpenChange={() => toggleFAQ(faq.id)}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex justify-between items-center w-full px-4 py-3 text-sm text-gray-900 font-bold">
                    {faq.question}
                    {faq.isOpen ? (
                      <ChevronUp className="w-4 h-4 text-green-800" />
                    ) : (
                      <Plus className="w-4 h-4 text-green-800" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-3 text-sm text-gray-700">
                  {faq.answer}
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>

        {/* Chat Button */}
        <Button className="w-full h-12 bg-green-700 hover:bg-green-800 text-white rounded-full text-sm font-semibold shadow">
          {/* <MessageCircle className="w-5 h-5 mr-2" /> */}
          Chat With Support
        </Button>

        {/* Contact Options */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
          {/* Email */}
          <div className="border rounded-xl p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <p className="text-sm sm:text-base font-semibold text-gray-800">
              Email Us
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
              support@company.com
            </p>
          </div>

          {/* Chat */}
          <div className="border rounded-xl p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <p className="text-sm sm:text-base font-semibold text-gray-800">
              Chat With Us
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Monday–Thursday</p>
            <p className="text-xs sm:text-sm text-gray-600">10am – 7pm</p>
          </div>

          {/* Call */}
          <div className="border rounded-xl p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <p className="text-sm sm:text-base font-semibold text-gray-800">
              Call Us Now
            </p>
            <p className="text-xs sm:text-sm text-gray-600 break-words">
              +1 (555) 456-7890
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Mon–Fri</p>
          </div>
        </div>

        {/* Support Tickets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Support Tickets</h3>
            <Button
              onClick={() => setShowTicketDialog(true)}
              size="sm"
              className="bg-green-700 hover:bg-green-800"
            >
              <FileText className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </div>
          <SupportTicketList
            onTicketClick={handleTicketClick}
            key={refreshTickets}
          />
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 px-4 md:hidden bg-white border-t rounded-t-2xl py-2">
        <div className="max-w-md mx-auto bg-white flex justify-around ">
          <Link href="/dashboard" className="flex flex-col items-center">
            <Home className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] text-gray-400">Home</span>
          </Link>
          <Link href="/bookings" className="flex flex-col items-center">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] text-gray-400">Booking</span>
          </Link>
          <Link
            href="/booking"
            className="w-10 h-10 rounded-full flex items-center justify-center -mt-4 shadow-md bg-green-600"
          >
            <Plus className=" text-white w-4 h-4 " />
          </Link>
          <Link href="/support" className="flex flex-col items-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span className="text-[10px] text-green-600 font-semibold">
              Chat
            </span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] text-gray-400">Profile</span>
          </Link>
        </div>
      </div>

      {/* Support Ticket Dialog */}
      <SupportTicketDialog
        open={showTicketDialog}
        onOpenChange={setShowTicketDialog}
        onTicketCreated={handleTicketCreated}
      />

      {/* Support Ticket Detail */}
      <SupportTicketDetail
        ticket={selectedTicket}
        open={showTicketDetail}
        onOpenChange={setShowTicketDetail}
        onTicketUpdated={handleTicketUpdated}
      />
    </PrimaryLayout>
  );
}
