import { Family, Sheet, Ticket, Level } from './types';

/**
 * Generate tickets for a family based on their assigned sheets
 */
export function generateTicketsForFamily(family: Family, sheets: Sheet[]): Ticket[] {
  const tickets: Ticket[] = [];
  const currentYear = new Date().getFullYear().toString().slice(-2);

  // Get sheets assigned to this family
  const familySheets = sheets.filter(sheet => family.sheetIds.includes(sheet.id));

  familySheets.forEach(sheet => {
    // Generate tickets for each number in the sheet range
    for (let i = sheet.startNumber; i <= sheet.endNumber; i++) {
      const ticketId = `${sheet.level}-${currentYear}${String(i).padStart(4, '0')}`;

      tickets.push({
        id: ticketId,
        level: sheet.level,
        sheetId: sheet.id,
        isUsed: false, // Default to unused
      });
    }
  });

  return tickets.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Create tickets in database for a family
 */
export async function createTicketsForFamily(familyId: string, tickets: Ticket[]) {
  try {
    const ticketsWithFamily = tickets.map(ticket => ({
      ...ticket,
      familyId,
    }));

    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickets: ticketsWithFamily }),
    });

    if (!response.ok) {
      throw new Error('Failed to create tickets');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating tickets:', error);
    throw error;
  }
}

/**
 * Load tickets for a family from database
 */
export async function loadTicketsForFamily(familyId: string): Promise<Ticket[]> {
  try {
    const response = await fetch(`/api/tickets?familyId=${familyId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to load tickets');
    }

    const data = await response.json();
    return data.tickets || [];
  } catch (error) {
    console.error('Error loading tickets:', error);
    return [];
  }
}

/**
 * Save ticket validation states to database
 */
export async function saveTicketValidation(
  familyId: string,
  ticketStates: {[key: string]: boolean},
  validatedBy?: string
) {
  try {
    const tickets = Object.entries(ticketStates).map(([id, isUsed]) => ({
      id,
      isUsed,
    }));

    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        familyId,
        tickets,
        validatedBy,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save ticket validation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving ticket validation:', error);
    throw error;
  }
}