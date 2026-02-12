import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

type TenantStats = {
  tenant: string;
  dealsWithInvalidAccount: number;
  dealsWithInvalidPrimaryContact: number;
  quotesWithInvalidAccount: number;
  quotesWithInvalidContact: number;
  quotesWithInvalidDeal: number;
  quotesWithInvalidInstallation: number;
  brokenDealQuoteLinks: number;
  repairedDeals: number;
  repairedQuotes: number;
  repairedLinks: number;
};

const normalize = (value: string) => value.trim().toLowerCase();

async function run(): Promise<void> {
  const tenants = await prisma.tenant.findMany({
    where: { active: true },
    select: { id: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  if (!tenants.length) {
    console.log("No active tenants found.");
    return;
  }

  const foreignAccountNameCache = new Map<string, string | null>();
  const foreignContactEmailCache = new Map<string, string | null>();

  const stats: TenantStats[] = [];

  for (const tenant of tenants) {
    const tenantStats: TenantStats = {
      tenant: tenant.slug,
      dealsWithInvalidAccount: 0,
      dealsWithInvalidPrimaryContact: 0,
      quotesWithInvalidAccount: 0,
      quotesWithInvalidContact: 0,
      quotesWithInvalidDeal: 0,
      quotesWithInvalidInstallation: 0,
      brokenDealQuoteLinks: 0,
      repairedDeals: 0,
      repairedQuotes: 0,
      repairedLinks: 0,
    };

    const [accounts, contacts, deals, installations, quotes, dealQuoteLinks] =
      await Promise.all([
        prisma.crmAccount.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, name: true },
        }),
        prisma.crmContact.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, accountId: true, email: true },
        }),
        prisma.crmDeal.findMany({
          where: { tenantId: tenant.id },
          select: {
            id: true,
            accountId: true,
            primaryContactId: true,
          },
        }),
        prisma.crmInstallation.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, accountId: true, name: true },
        }),
        prisma.cpqQuote.findMany({
          where: { tenantId: tenant.id },
          select: {
            id: true,
            accountId: true,
            contactId: true,
            dealId: true,
            installationId: true,
            clientName: true,
          },
        }),
        prisma.crmDealQuote.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, dealId: true, quoteId: true },
        }),
      ]);

    const accountById = new Map(accounts.map((account) => [account.id, account]));
    const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
    const dealById = new Map(deals.map((deal) => [deal.id, deal]));
    const installationById = new Map(
      installations.map((installation) => [installation.id, installation])
    );
    const quoteById = new Map(quotes.map((quote) => [quote.id, quote]));

    const accountIdsByName = new Map<string, string[]>();
    for (const account of accounts) {
      const key = normalize(account.name);
      const list = accountIdsByName.get(key) ?? [];
      list.push(account.id);
      accountIdsByName.set(key, list);
    }

    const contactIdsByEmailAndAccount = new Map<string, string[]>();
    for (const contact of contacts) {
      if (!contact.email) continue;
      const key = `${contact.accountId}|${normalize(contact.email)}`;
      const list = contactIdsByEmailAndAccount.get(key) ?? [];
      list.push(contact.id);
      contactIdsByEmailAndAccount.set(key, list);
    }

    const getForeignAccountName = async (accountId: string): Promise<string | null> => {
      if (foreignAccountNameCache.has(accountId)) {
        return foreignAccountNameCache.get(accountId) ?? null;
      }
      const account = await prisma.crmAccount.findUnique({
        where: { id: accountId },
        select: { name: true },
      });
      const name = account?.name ?? null;
      foreignAccountNameCache.set(accountId, name);
      return name;
    };

    const getForeignContactEmail = async (contactId: string): Promise<string | null> => {
      if (foreignContactEmailCache.has(contactId)) {
        return foreignContactEmailCache.get(contactId) ?? null;
      }
      const contact = await prisma.crmContact.findUnique({
        where: { id: contactId },
        select: { email: true },
      });
      const email = contact?.email ? normalize(contact.email) : null;
      foreignContactEmailCache.set(contactId, email);
      return email;
    };

    for (const deal of deals) {
      let nextAccountId = deal.accountId;
      let nextPrimaryContactId = deal.primaryContactId;
      let changed = false;

      if (!accountById.has(deal.accountId)) {
        tenantStats.dealsWithInvalidAccount++;
        const foreignName = await getForeignAccountName(deal.accountId);
        if (foreignName) {
          const matches = accountIdsByName.get(normalize(foreignName)) ?? [];
          if (matches.length === 1) {
            nextAccountId = matches[0];
            changed = true;
          }
        }
      }

      if (nextPrimaryContactId) {
        const contact = contactById.get(nextPrimaryContactId);
        if (!contact || contact.accountId !== nextAccountId) {
          tenantStats.dealsWithInvalidPrimaryContact++;
          let repairedContactId: string | null = null;
          const foreignEmail = await getForeignContactEmail(nextPrimaryContactId);
          if (foreignEmail) {
            const matches =
              contactIdsByEmailAndAccount.get(`${nextAccountId}|${foreignEmail}`) ?? [];
            if (matches.length === 1) {
              repairedContactId = matches[0];
            }
          }
          nextPrimaryContactId = repairedContactId;
          changed = true;
        }
      }

      if (changed) {
        tenantStats.repairedDeals++;
        if (APPLY) {
          await prisma.crmDeal.update({
            where: { id: deal.id },
            data: {
              accountId: nextAccountId,
              primaryContactId: nextPrimaryContactId,
            },
          });
          deal.accountId = nextAccountId;
          deal.primaryContactId = nextPrimaryContactId;
          dealById.set(deal.id, deal);
        }
      }
    }

    for (const quote of quotes) {
      let nextAccountId = quote.accountId;
      let nextContactId = quote.contactId;
      let nextDealId = quote.dealId;
      let nextInstallationId = quote.installationId;
      let changed = false;

      if (nextDealId && !dealById.has(nextDealId)) {
        tenantStats.quotesWithInvalidDeal++;
        nextDealId = null;
        changed = true;
      }

      if (nextAccountId && !accountById.has(nextAccountId)) {
        tenantStats.quotesWithInvalidAccount++;
        let repairedAccountId: string | null = null;
        if (quote.clientName) {
          const matches = accountIdsByName.get(normalize(quote.clientName)) ?? [];
          if (matches.length === 1) {
            repairedAccountId = matches[0];
          }
        }
        nextAccountId = repairedAccountId;
        changed = true;
      }

      if (nextDealId) {
        const linkedDeal = dealById.get(nextDealId);
        if (linkedDeal && linkedDeal.accountId !== nextAccountId) {
          nextAccountId = linkedDeal.accountId;
          changed = true;
        }
        if (!nextContactId && linkedDeal?.primaryContactId) {
          nextContactId = linkedDeal.primaryContactId;
          changed = true;
        }
      }

      if (nextContactId) {
        const contact = contactById.get(nextContactId);
        if (!contact || (nextAccountId && contact.accountId !== nextAccountId)) {
          tenantStats.quotesWithInvalidContact++;
          nextContactId = null;
          changed = true;
        }
      }

      if (nextInstallationId) {
        const installation = installationById.get(nextInstallationId);
        if (
          !installation ||
          (nextAccountId &&
            installation.accountId &&
            installation.accountId !== nextAccountId)
        ) {
          tenantStats.quotesWithInvalidInstallation++;
          nextInstallationId = null;
          changed = true;
        }
      }

      if (changed) {
        tenantStats.repairedQuotes++;
        if (APPLY) {
          await prisma.cpqQuote.update({
            where: { id: quote.id },
            data: {
              accountId: nextAccountId,
              contactId: nextContactId,
              dealId: nextDealId,
              installationId: nextInstallationId,
            },
          });
          quote.accountId = nextAccountId;
          quote.contactId = nextContactId;
          quote.dealId = nextDealId;
          quote.installationId = nextInstallationId;
          quoteById.set(quote.id, quote);
        }
      }
    }

    for (const link of dealQuoteLinks) {
      if (!dealById.has(link.dealId) || !quoteById.has(link.quoteId)) {
        tenantStats.brokenDealQuoteLinks++;
        if (APPLY) {
          await prisma.crmDealQuote.delete({ where: { id: link.id } });
          tenantStats.repairedLinks++;
        }
      }
    }

    stats.push(tenantStats);
  }

  const totals = stats.reduce(
    (acc, item) => ({
      dealsWithInvalidAccount:
        acc.dealsWithInvalidAccount + item.dealsWithInvalidAccount,
      dealsWithInvalidPrimaryContact:
        acc.dealsWithInvalidPrimaryContact + item.dealsWithInvalidPrimaryContact,
      quotesWithInvalidAccount:
        acc.quotesWithInvalidAccount + item.quotesWithInvalidAccount,
      quotesWithInvalidContact:
        acc.quotesWithInvalidContact + item.quotesWithInvalidContact,
      quotesWithInvalidDeal: acc.quotesWithInvalidDeal + item.quotesWithInvalidDeal,
      quotesWithInvalidInstallation:
        acc.quotesWithInvalidInstallation + item.quotesWithInvalidInstallation,
      brokenDealQuoteLinks:
        acc.brokenDealQuoteLinks + item.brokenDealQuoteLinks,
      repairedDeals: acc.repairedDeals + item.repairedDeals,
      repairedQuotes: acc.repairedQuotes + item.repairedQuotes,
      repairedLinks: acc.repairedLinks + item.repairedLinks,
    }),
    {
      dealsWithInvalidAccount: 0,
      dealsWithInvalidPrimaryContact: 0,
      quotesWithInvalidAccount: 0,
      quotesWithInvalidContact: 0,
      quotesWithInvalidDeal: 0,
      quotesWithInvalidInstallation: 0,
      brokenDealQuoteLinks: 0,
      repairedDeals: 0,
      repairedQuotes: 0,
      repairedLinks: 0,
    }
  );

  console.log(APPLY ? "Tenant quadrature audit (apply mode)" : "Tenant quadrature audit (dry-run)");
  console.table(stats);
  console.log("Totals:", totals);
}

run()
  .catch((error) => {
    console.error("Tenant quadrature audit failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
