"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TbArrowLeft } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import type { CustomerOption } from "@/lib/customers/types";
import {
  useDeleteReservationMutation,
  useUpdateReservationMutation,
} from "@/lib/query/reservations/reservations.mutations";
import type { Reservation } from "@/lib/reservations/types";
import { ReservationDialog } from "./reservation-dialog";
import type { ReservationFormSubmitData } from "./reservation-dialog.types";

type ReservationDetailPageClientProps = {
  labels: any;
  restaurantId: string;
  reservation: Reservation;
  customers: CustomerOption[];
  backLabel: string;
};

export function ReservationDetailPageClient({
  labels,
  restaurantId,
  reservation,
  customers,
  backLabel,
}: ReservationDetailPageClientProps) {
  const router = useRouter();
  const [activeReservation, setActiveReservation] =
    useState<Reservation>(reservation);
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const updateMutation = useUpdateReservationMutation(restaurantId);
  const deleteMutation = useDeleteReservationMutation(restaurantId);

  const handleClose = () => {
    setIsDialogOpen(false);
    router.push("/dashboard/reservations");
  };

  const handleSubmit = (data: ReservationFormSubmitData) => {
    updateMutation.mutate(
      { reservationId: activeReservation.id, input: data },
      {
        onSuccess: (response) => {
          setActiveReservation(response.reservation);
          toast.success(labels.form.successUpdate);
          handleClose();
        },
        onError: () => {
          toast.error(labels.form.errorUpdate);
        },
      },
    );
  };

  return (
    <main className="flex flex-col gap-4 p-4 md:p-6">
      <Button
        type="button"
        variant="ghost"
        className="w-fit gap-2 rounded-xl px-2"
        onClick={handleClose}
      >
        <TbArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Button>

      <ReservationDialog
        labels={labels}
        customers={customers}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            handleClose();
          }
        }}
        onClose={handleClose}
        reservation={activeReservation}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending || deleteMutation.isPending}
      />
    </main>
  );
}
