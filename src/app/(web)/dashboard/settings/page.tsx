'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SiteHeader } from '@/components/site-header';

interface ReservationStatus {
  status: 'paused' | 'resumed';
}

const ReservationControlDashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>({
    status: 'resumed',
  });
  const [pendingStatus, setPendingStatus] = useState<'paused' | 'resumed' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      signIn();
    } else if (session.user?.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!session) return;
    const fetchStatus = async () => {
      const res = await fetch('/api/v1/reservation-status');
      if (res.ok) {
        const data: ReservationStatus = await res.json();
        setReservationStatus(data);
      }
    };
    fetchStatus();
  }, [session]);

  const confirmToggle = async () => {
    if (!pendingStatus || !session) return;
    setLoading(true);

    const res = await fetch('/api/v1/reservation-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ status: pendingStatus }),
    });

    if (res.ok) {
      const data: ReservationStatus = await res.json();
      setReservationStatus(data);
    }

    setLoading(false);
    setDialogOpen(false);
    setPendingStatus(null);
  };

  if (status === 'loading' || !session || session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <SiteHeader />

      <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-white border border-gray-300 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Contrôle des Réservations
              </CardTitle>
              <CardDescription className="text-gray-500 text-sm mt-1">
                Actuellement :{' '}
                <span className="text-black font-medium">
                  {reservationStatus.status === 'paused' ? 'Suspendu' : 'Actif'}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-800">
                  Réservation {reservationStatus.status === 'paused' ? 'Désactivée' : 'Activée'}
                </span>
                <Switch
                  checked={reservationStatus.status === 'resumed'}
                  onCheckedChange={() => {
                    const newStatus = reservationStatus.status === 'paused' ? 'resumed' : 'paused';
                    setPendingStatus(newStatus);
                    setDialogOpen(true);
                  }}
                  disabled={loading}
                />
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmer l'action</DialogTitle>
                      <DialogDescription>
                        Êtes-vous sûr de vouloir{' '}
                        <span className="font-semibold">
                          {pendingStatus === 'paused' ? 'suspendre' : 'reprendre'}
                        </span>{' '}
                        les réservations ?
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDialogOpen(false);
                          setPendingStatus(null);
                        }}
                        disabled={loading}
                      >
                        Annuler
                      </Button>
                      <Button onClick={confirmToggle} disabled={loading}>
                        {loading ? 'Mise à jour...' : 'Confirmer'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default ReservationControlDashboard;
