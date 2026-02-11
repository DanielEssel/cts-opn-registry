import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { RiderFormValues } from "@/app/lib/validations"
import { UseFormReturn } from "react-hook-form"


//  Interface for the Props
interface StepTwoProps {
  form: UseFormReturn<RiderFormValues>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean; // This fixes the error!
}

export default function StepTwoLocation({ form, onBack, onSubmit, isSubmitting }: StepTwoProps) {
  const selectedTown = form.watch("town")
  
  // Logic to show a preview of the OPN
  const getPreview = () => {
    const code = selectedTown === "kumasi" ? "KS" : selectedTown === "accra" ? "AC" : "???"
    const month = new Date().getMonth() + 1
    const year = new Date().getFullYear()
    return `${code}-XXXX-${month.toString().padStart(2, '0')}-${year}`
  }

  return (
    <Form {...form}>
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Estimated OPN</span>
          <p className="text-2xl font-mono font-black text-blue-700">{getPreview()}</p>
        </div>

        <FormField
          control={form.control}
          name="town"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operational Town</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your town" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="accra">Accra (AC)</SelectItem>
                  <SelectItem value="kumasi">Kumasi (KS)</SelectItem>
                  <SelectItem value="tamale">Tamale (TM)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="licensePlate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle License Plate</FormLabel>
              <FormControl>
                <Input placeholder="e.g. GX-1234-26" {...field} className="h-12" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onBack} className="flex-1 h-12">
            Back
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isSubmitting}
            className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Complete Registration"}
          </Button>
        </div>
      </div>
    </Form>
  )
}