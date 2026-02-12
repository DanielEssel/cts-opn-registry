"use client"

import { useEffect, useState } from "react" // Added
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth, db } from "@/lib/firebase" // Added
import { doc, getDoc } from "firebase/firestore" // Added
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { UserPlus, ShieldCheck, Phone, MapPin, Edit3, Save, Lock } from "lucide-react"
import { saveRider } from "@/lib/rider-service" // Ensure this is imported correctly

interface NewRiderFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export default function NewRiderForm({ onSuccess, initialData }: NewRiderFormProps) {
  const isEdit = !!initialData;
  const [userProfile, setUserProfile] = useState<{ role: string; entity: string } | null>(null);

  const { register, handleSubmit, control, setValue } = useForm({
    defaultValues: initialData || {
      fullName: "",
      idType: "",
      idNumber: "",
      phone: "",
      town: ""
    }
  });

  // 1. Fetch Admin Profile to lock the Town field
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "admin_users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profile = docSnap.data() as any;
          setUserProfile(profile);
          
          // Auto-set town if not Super Admin and not in Edit mode
          if (profile.role !== "Super Admin" && !isEdit) {
            setValue("town", profile.entity);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [setValue, isEdit]);

  const onSubmit = async (data: any) => {
    // Ensure town is strictly enforced based on profile for non-Super Admins
    const submissionData = {
      ...data,
      town: userProfile?.role === "Super Admin" ? data.town : (userProfile?.entity || data.town)
    };

    const result = await saveRider(submissionData, isEdit, initialData?.id);
    
    if (result.success) {
      onSuccess();
    } else {
      alert("Something went wrong saving to Firebase.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
      {/* Personal Identity Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600">
          {isEdit ? <Edit3 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          <h3 className="font-bold text-sm uppercase tracking-wider">
            {isEdit ? "Edit Identity" : "Personal Identity"}
          </h3>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Legal Name</Label>
          <Input id="fullName" placeholder="e.g. Kwesi Mensah" className="h-11" {...register("fullName")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="idType">ID Type</Label>
            <Controller
              name="idType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ghana_card">Ghana Card</SelectItem>
                    <SelectItem value="license">Driver's License</SelectItem>
                    <SelectItem value="voter">Voter's ID</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="idNumber">ID Number</Label>
            <Input id="idNumber" placeholder="GHA-XXXXX" className="h-11" {...register("idNumber")} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact & Location Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600">
          <MapPin className="h-5 w-5" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Contact & Location</h3>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input id="phone" className="pl-10 h-11" placeholder="024 000 0000" {...register("phone")} />
          </div>
        </div>

        {/* TOWN SELECTION: Locked for District Admins */}
        <div className="grid gap-2">
          <Label htmlFor="town" className="flex items-center gap-2">
            Assigned District / Town
            {userProfile?.role !== "Super Admin" && <Lock className="h-3 w-3 text-slate-400" />}
          </Label>
          
          <Controller
            name="town"
            control={control}
            render={({ field }) => (
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={userProfile?.role !== "Super Admin"} // Lock it!
              >
                <SelectTrigger className={`h-11 ${userProfile?.role !== "Super Admin" ? "bg-slate-50 border-slate-200" : "border-blue-100 bg-blue-50/30"}`}>
                  <SelectValue placeholder="Assign a Town" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kumasi">Kumasi (KS)</SelectItem>
                  <SelectItem value="Accra">Accra (AC)</SelectItem>
                  <SelectItem value="Tamale">Tamale (TM)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-[10px] text-slate-500 italic">
            {userProfile?.role === "Super Admin" 
              ? "This determines the OPN prefix." 
              : `Locked to your assigned district: ${userProfile?.entity}`}
          </p>
        </div>
      </div>

      <div className="pt-6">
        <Button 
          type="submit" 
          disabled={!userProfile}
          className={`w-full h-12 shadow-lg shadow-blue-200 ${
            isEdit ? "bg-slate-900 hover:bg-slate-800" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isEdit ? (
            <><Save className="mr-2 h-4 w-4" /> Save Changes</>
          ) : (
            <><ShieldCheck className="mr-2 h-4 w-4" /> Generate OPN & Register Rider</>
          )}
        </Button>
      </div>
    </form>
  )
}