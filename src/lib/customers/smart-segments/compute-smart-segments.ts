import type { CustomerListItem } from "@/lib/customers/types";
import { isReservationFrequentCustomer } from "@/lib/customers/segments";
import type { CustomerSmartSegment } from "@/lib/customers/smart-segments/types";
import enMessages from "@/i18n/messages/en.json";
import esMessages from "@/i18n/messages/es.json";

type RuleSegmentDefinition = {
  id: string;
  name: string;
  description: string;
  matches: (customer: CustomerListItem) => boolean;
};

function getSegmentMessages(locale: string) {
  return locale === "en"
    ? enMessages.dashboard.customers.segments.cards
    : esMessages.dashboard.customers.segments.cards;
}

export function computeRuleBasedSmartSegments(
  customers: CustomerListItem[],
  locale: string,
): CustomerSmartSegment[] {
  const cards = getSegmentMessages(locale);

  const definitions: RuleSegmentDefinition[] = [
    {
      id: "vip",
      name: cards.vip.name,
      description: cards.vip.description,
      matches: (customer) => customer.segments.includes("vip"),
    },
    {
      id: "frequent",
      name: cards.frequent.name,
      description: cards.frequent.description,
      matches: (customer) => customer.segments.includes("frequent"),
    },
    {
      id: "at_risk",
      name: cards.atRisk.name,
      description: cards.atRisk.description,
      matches: (customer) => customer.segments.includes("at_risk"),
    },
    {
      id: "inactive",
      name: cards.inactive.name,
      description: cards.inactive.description,
      matches: (customer) => customer.segments.includes("inactive"),
    },
    {
      id: "high_value",
      name: cards.highValue.name,
      description: cards.highValue.description,
      matches: (customer) => customer.segments.includes("high_value"),
    },
    {
      id: "whatsapp",
      name: cards.whatsapp.name,
      description: cards.whatsapp.description,
      matches: (customer) => customer.segments.includes("whatsapp"),
    },
    {
      id: "reservation_frequent",
      name: cards.reservationFrequent.name,
      description: cards.reservationFrequent.description,
      matches: (customer) =>
        isReservationFrequentCustomer(customer.reservationCount),
    },
    {
      id: "new",
      name: cards.new.name,
      description: cards.new.description,
      matches: (customer) => customer.segments.includes("new"),
    },
  ];

  return definitions
    .map((definition) => {
      const matched = customers.filter(definition.matches);

      if (matched.length === 0) {
        return null;
      }

      return {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        customerIds: matched.map((customer) => customer.id),
      };
    })
    .filter((segment): segment is CustomerSmartSegment => segment !== null);
}
