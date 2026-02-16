"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { lookupByGhanaCard, lookupByPhoneNumber } from "@/lib/rider-lookup";
import { RiderDetails } from "./rider-details";
import { RiderRecord } from "@/lib/rider-service";

const ghanaCardSchema = z.object({
  ghanaCardNumber: z
    .string()
    .regex(/^GHA-\d{9}-\d$/, "Invalid Ghana Card format (GHA-XXXXXXXXX-X)"),
});

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

type GhanaCardFormData = z.infer<typeof ghanaCardSchema>;
type PhoneFormData = z.infer<typeof phoneSchema>;

export function LookupForm() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [riderFound, setRiderFound] = useState<(RiderRecord & { id: string }) | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const ghanaCardForm = useForm<GhanaCardFormData>({
    resolver: zodResolver(ghanaCardSchema),
    defaultValues: {
      ghanaCardNumber: "",
    },
  });

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  const handleGhanaCardSearch = async (data: GhanaCardFormData) => {
    setIsSearching(true);
    setSearchError("");
    setRiderFound(null);
    setSearchAttempted(true);

    try {
      const result = await lookupByGhanaCard(data.ghanaCardNumber);

      if (result.found && result.rider) {
        setRiderFound(result.rider);
      } else if (result.error) {
        setSearchError(result.error);
      }
    } catch (error) {
      setSearchError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePhoneSearch = async (data: PhoneFormData) => {
    setIsSearching(true);
    setSearchError("");
    setRiderFound(null);
    setSearchAttempted(true);

    try {
      const result = await lookupByPhoneNumber(data.phoneNumber);

      if (result.found && result.rider) {
        setRiderFound(result.rider);
      } else if (result.error) {
        setSearchError(result.error);
      }
    } catch (error) {
      setSearchError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setRiderFound(null);
    setSearchError("");
    setSearchAttempted(false);
    ghanaCardForm.reset();
    phoneForm.reset();
  };

  if (riderFound) {
    return <RiderDetails rider={riderFound} onReset={handleReset} />;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Search className="w-6 h-6" />
          Retrieve Your OPN
        </CardTitle>
        <CardDescription>
          Search for your Operating Permit Number using your Ghana Card or Phone Number
        </CardDescription>
      </CardHeader>

      <CardContent>
        {searchError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        )}

        {searchAttempted && !riderFound && !searchError && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800">
              No registration found with the provided information. Please check your details and try again,
              or register if you haven&apos;t already.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="ghana-card" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ghana-card">Ghana Card</TabsTrigger>
            <TabsTrigger value="phone">Phone Number</TabsTrigger>
          </TabsList>

          <TabsContent value="ghana-card" className="mt-6">
            <Form {...ghanaCardForm}>
              <form
                onSubmit={ghanaCardForm.handleSubmit(handleGhanaCardSearch)}
                className="space-y-6"
              >
                <FormField
                  control={ghanaCardForm.control}
                  name="ghanaCardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ghana Card Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="GHA-123456789-1"
                          {...field}
                          className="h-12 text-lg uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          disabled={isSearching}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Search by Ghana Card
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="phone" className="mt-6">
            <Form {...phoneForm}>
              <form
                onSubmit={phoneForm.handleSubmit(handlePhoneSearch)}
                className="space-y-6"
              >
                <FormField
                  control={phoneForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0241234567"
                          {...field}
                          maxLength={10}
                          className="h-12 text-lg"
                          disabled={isSearching}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Search by Phone Number
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Make sure to enter your Ghana Card in the format: GHA-XXXXXXXXX-X</li>
            <li>• Phone number should be 10 digits without country code</li>
            <li>• Use the same information you provided during registration</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}