"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Search,
  CheckCircle,
  FileText,
  ArrowRight,
  MapPin,
  AlertCircle,
  Sparkles,
  Clock,
  Users,
  TrendingUp,
  Lock,
  Zap,
} from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className=" z-20 max-h-15 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-20 items-center justify-between">
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-3 ">
            
              <Image
                src="/logo/rinlogo2.png"
                alt="RIN Registry"
                width={80}
                height={80}
                className="object-contain transition duration-300 group-hover:scale-105"
                priority
              />
              <div><h1 className="text-emerald-900 font-bold">CTS Rider Identification Number</h1></div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link href="/retrieve">
                <Button
                  variant="ghost"
                  className="hidden sm:flex items-center mb-3 text-gray-600 hover:text-gray-900"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Find RIN
                </Button>
              </Link>

              <Link href="/login">
                <Button className="bg-green-600 hover:bg-green-700 mb-4 text-white px-4 shadow-sm">
                  <Lock className="mr-2 h-4 w-4" />
                  Officer Login
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Vehicle Images */}
      <section className="relative bg-gradient-to-b from-green-50 to-white  md:py-10 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <Badge className="mb-6 px-4 py-2 text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 border border-green-200">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Greater Accra Region Pilot Program
              </Badge>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                 Rider
                <span className="block mt-2 text-green-600">
                  Identification Number
                </span>
                <span className="block text-yellow-500">System</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                Official digital platform for commercial transport rider identification
                in Ghana.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link href="/retrieve">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-lg px-8 py-6 bg-green-600 hover:bg-green-700 shadow-xl hover:shadow-2xl transition-all group"
                  >
                    <Search className="mr-2 w-6 h-6 group-hover:scale-110 transition" />
                    Check My Rider Status
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Users, value: "10K+", label: "Riders" },
                  { icon: Shield, value: "100%", label: "Secure" },
                  { icon: Clock, value: "5 Min", label: "Process" },
                  { icon: TrendingUp, value: "99.9%", label: "Uptime" },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition group"
                  >
                    <stat.icon className="w-5 h-5 text-green-600 mx-auto lg:mx-0 mb-2 group-hover:scale-110 transition" />
                    <div className="font-bold text-xl text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Vehicle Images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* Pragya */}
                <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 border-4 border-green-100 hover:border-green-300">
                  <div className="relative h-64 bg-gray-200">
                    <Image
                      src="/images/pragya.avif"
                      alt="Pragya - Three-wheeled vehicle"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback to placeholder
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%2316a34a' width='400' height='300'/%3E%3Ctext fill='white' font-size='24' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EPragya%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-gray-200">
                    <h3 className="font-bold text-gray-900">Pragya</h3>
                    <p className="text-xs text-gray-600">Three-wheeler</p>
                  </div>
                </div>

                {/* Okada */}
                <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 border-4 border-yellow-100 hover:border-yellow-300 mt-8">
                  <div className="relative h-64 bg-gray-200">
                    <Image
                      src="/images/okada.jpg"
                      alt="Okada - Motorcycle"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23eab308' width='400' height='300'/%3E%3Ctext fill='white' font-size='24' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EOkada%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-gray-200">
                    <h3 className="font-bold text-gray-900">Okada</h3>
                    <p className="text-xs text-gray-600">Motorbike</p>
                  </div>
                </div>

                {/* Aboboyaa */}
                <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 border-4 border-blue-100 hover:border-blue-300 col-span-2">
                  <div className="relative h-64 bg-gray-200">
                    <Image
                      src="/images/aboboyaa.webp"
                      alt="Aboboyaa - Tricycle"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='300'%3E%3Crect fill='%233b82f6' width='800' height='300'/%3E%3Ctext fill='white' font-size='24' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EAboboyaa%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-gray-200">
                    <h3 className="font-bold text-gray-900">Aboboyaa</h3>
                    <p className="text-xs text-gray-600">Tricycle</p>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm rotate-12">
                All Vehicle Types
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our System?
            </h2>
            <p className="text-lg text-gray-600">
              Built for efficiency, security, and ease of use
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Official System",
                description: "Government-approved platform for rider permits",
                color: "blue-600",
                bgColor: "blue-50",
              },
              {
                icon: Zap,
                title: "Instant Verification",
                description: "Check your registration status anytime online",
                color: "green-600",
                bgColor: "green-50",
              },
              {
                icon: CheckCircle,
                title: "6 Months Valid",
                description: "Each registration is valid for 6 months from issue",
                color: "yellow-600",
                bgColor: "yellow-50",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-200"
              >
                <CardContent className="pt-8 pb-6">
                  <div
                    className={`w-14 h-14 bg-${feature.bgColor} rounded-2xl flex items-center justify-center mb-5 shadow-lg transform group-hover:scale-110 transition`}
                  >
                    <feature.icon className={`w-7 h-7 text-${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Get Registered Section */}
      <section className="bg-gray-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 px-4 py-1 text-sm font-semibold border-green-600 text-green-700"
            >
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              How to Get Your Rider Registration
            </h2>
            <p className="text-xl text-gray-600">
              Registration is done through authorized operators only
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                step: "01",
                title: "Visit an Authorized Operator",
                description:
                  "Find a registered government operator in your district (list available at district offices)",
                icon: MapPin,
              },
              {
                step: "02",
                title: "Bring Required Documents",
                description:
                  "Ghana Card, Driver's License, Vehicle Registration, and passport photo",
                icon: FileText,
              },
              {
                step: "03",
                title: "Operator Registers You",
                description:
                  "The operator will input your information into the system on your behalf",
                icon: Users,
              },
              {
                step: "04",
                title: "Receive Your RIN",
                description:
                  "Get your Rider Identification Number (RIN) instantly and keep it safe",
                icon: CheckCircle,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-6 items-start bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group border border-gray-100"
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl group-hover:scale-110 transition">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <item.icon className="w-6 h-6 text-green-600" />
                    <h3 className="font-bold text-2xl text-gray-900">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-yellow-300 bg-yellow-50 shadow-xl">
            <CardContent className="pt-8 pb-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-8 h-8 text-yellow-900" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-gray-900 mb-4">
                    Important Notice
                  </h3>
                  <ul className="space-y-3 text-base text-gray-800">
                    {[
                      "Registration is FREE of charge",
                      "Only register through authorized government operators",
                      "Beware of fraudulent agents charging illegal fees",
                      "Keep your RIN safe and present it during checks",
                      "Renew your registration before the 6-month expiry date",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-green-600 py-24">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Already Registered?
          </h2>
          <p className="text-white/95 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Retrieve your Rider Identification Number and check your RIN status
            online
          </p>
          <Link href="/retrieve">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 py-6 bg-white hover:bg-gray-50 text-gray-900 shadow-2xl group"
            >
              <Search className="mr-3 w-6 h-6 group-hover:scale-110 transition" />
              Find My RIN
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-white">Ghana RIN</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                Official Rider Registration System for Ghana. Ensuring safe,
                legal, and regulated commercial transport operations across
                Greater Accra.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 text-lg">For Riders</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/retrieve"
                    className="hover:text-white transition flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Check Registration Status
                  </Link>
                </li>
                <li>
                  <Link
                    href="/retrieve"
                    className="hover:text-white transition flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Find My RIN
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 text-lg">
                For Operators
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/login"
                    className="hover:text-white transition flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Operator Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-white transition flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Register Riders
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p>
              © {new Date().getFullYear()} Rider Registration System. All
              rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-white transition">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white transition">
                Terms
              </Link>
              <Link href="#" className="hover:text-white transition">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
