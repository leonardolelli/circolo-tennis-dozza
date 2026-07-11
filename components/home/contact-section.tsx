import { Camera, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CLUB_CONTACT } from "@/lib/constants";

/** Club secretary contact card with one-tap "call" and "WhatsApp" actions. */
export function ContactSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-10">
      <div className="mb-8 flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-tennis">
          Contatti
        </span>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Parla con la segreteria
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Segreteria del circolo</CardTitle>
          <CardDescription>
            Per prenotazioni, iscrizioni e informazioni sui corsi.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-6">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-tennis" />
              {CLUB_CONTACT.address}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-tennis" />
              {CLUB_CONTACT.email}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-tennis" />
              {CLUB_CONTACT.phoneDisplay}
            </span>
            <a
              href={CLUB_CONTACT.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-tennis hover:underline"
            >
              <Camera className="h-4 w-4 shrink-0 text-tennis" />
              tennis_dozza
            </a>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={`tel:${CLUB_CONTACT.phoneHref}`}>
                <Phone className="h-4 w-4" />
                Chiama
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-tennis/40 text-tennis hover:bg-tennis/10 hover:text-tennis"
            >
              <a
                href={`https://wa.me/${CLUB_CONTACT.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                Scrivi su WhatsApp
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
