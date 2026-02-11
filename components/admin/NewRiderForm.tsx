"use client"

import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { UserPlus, ShieldCheck, Phone, MapPin, Edit3, Save } from "lucide-react"

interface NewRiderFormProps {
  onSuccess: () => void;
  initialData?: any; // Add this to handle Edit mode
}



export default function NewRiderForm({ onSuccess, initialData }: NewRiderFormProps) {
  // isEdit determines if we are updating or creating
  const isEdit = !!initialData;
 

  const { register, handleSubmit, control } = useForm({
    defaultValues: initialData || {
      fullName: "",
      idType: "",
      idNumber: "",
      phone: "",
      town: ""
    }
  })
const onSubmit = async (data: any) => {
  // result is now typed as ServiceResponse automatically
  const result = await saveRider(data, isEdit, initialData?.id);
  
  // TypeScript now knows 'success' exists and can be tested
  if (result.success) {
    console.log("Saved!", result.opn);
    onSuccess();
  } else {
    alert("Something went wrong saving to Firebase.");
  }
};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
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

        <div className="grid gap-2">
          <Label htmlFor="town">Assigned District / Town</Label>
          <Controller
            name="town"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="h-11 border-blue-100 bg-blue-50/30">
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
          <p className="text-[10px] text-slate-500 italic">This determines the OPN prefix.</p>
        </div>
      </div>

      <div className="pt-6">
        <Button 
          type="submit" 
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

function saveRider(data: any, isEdit: boolean, id: any) {
  throw new Error("Function not implemented.")
}
