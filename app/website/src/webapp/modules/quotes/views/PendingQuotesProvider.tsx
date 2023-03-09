import { useMemo, useState } from "react";

import { plural, shortNSweet, IQuote, IUtilActionTypes, IQuoteActionTypes, IBookingActionTypes, IBooking, IUserProfileActionTypes } from "awayto";
import { useAct, useApi, useRedux } from "awayto-hooks";

import { PendingQuotesContext, PendingQuotesContextType } from "./PendingQuotesContext";

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { SET_SNACK, OPEN_CONFIRM } = IUtilActionTypes;
const { DISABLE_QUOTE } = IQuoteActionTypes;
const { POST_BOOKING } = IBookingActionTypes;

export function PendingQuotesProvider ({ children }: IProps): JSX.Element {

  const act = useAct();
  const api = useApi();

  const [pendingQuotesChanged, setPendingQuotesChanged] = useState(false);
  const [selectedPendingQuotes, setSelectedPendingQuotes] = useState<IQuote[]>([]);

  const { quotes } = useRedux(state => state.profile);

  const pendingQuotes = useMemo(() => Object.values(quotes || {}), [quotes]);

  const pendingQuotesContext = {
    pendingQuotes,
    pendingQuotesChanged,
    selectedPendingQuotes,
    setSelectedPendingQuotes,
    handleSelectPendingQuote(quote) {
      const currentIndex = selectedPendingQuotes.indexOf(quote);
      const newChecked = [...selectedPendingQuotes];

      if (currentIndex === -1) {
        newChecked.push(quote);
      } else {
        newChecked.splice(currentIndex, 1);
      }

      setSelectedPendingQuotes(newChecked);
    },
    handleSelectPendingQuoteAll() {
      const pendingQuotesSet = selectedPendingQuotes.length === pendingQuotes.length ?
        selectedPendingQuotes.filter(v => !pendingQuotes.includes(v)) :
        [...selectedPendingQuotes, ...pendingQuotes.filter(v => !selectedPendingQuotes.includes(v))];
      
      setSelectedPendingQuotes(pendingQuotesSet);
    },
    approvePendingQuotes() {
      if (!selectedPendingQuotes.every(s => s.slotDate === selectedPendingQuotes[0].slotDate && s.scheduleBracketSlotId === selectedPendingQuotes[0].scheduleBracketSlotId)) {
        act(SET_SNACK, { snackType: 'error', snackOn: 'Only appointments of the same date and time can be mass approved.' });
        return;
      }

      const { slotDate, startTime, scheduleBracketSlotId } = selectedPendingQuotes[0];

      const copies = Object.values(quotes).filter(q => !selectedPendingQuotes.some(s => s.id === q.id)).filter(q => q.slotDate === slotDate && q.scheduleBracketSlotId === scheduleBracketSlotId);

      void act(OPEN_CONFIRM, {
        isConfirming: true,
        confirmEffect: `Approve ${plural(selectedPendingQuotes.length, 'request', 'requests')}, creating ${plural(selectedPendingQuotes.length, 'booking', 'bookings')}, for ${shortNSweet(slotDate, startTime)}.`,
        confirmSideEffect: !copies.length ? undefined : {
          approvalAction: 'Auto-Deny Remaining',
          approvalEffect: `Automatically deny all other requests for ${shortNSweet(slotDate, startTime)} (this cannot be undone).`,
          rejectionAction: 'Confirm Quote/Booking Only',
          rejectionEffect: 'Just submit the approvals.',
        },
        confirmAction: approval => {
          const [, res] = api(POST_BOOKING, { bookings: selectedPendingQuotes.map(s => ({ quoteId: s.id, slotDate: s.slotDate, scheduleBracketSlotId: s.scheduleBracketSlotId }) as IBooking) }, { load: true });
          res?.then(() => {
            const [, rez] = api(DISABLE_QUOTE, { ids: selectedPendingQuotes.concat(approval ? copies : []).map(s => s.id).join(',') });
            rez?.then(() => {
              setSelectedPendingQuotes([]);
              setPendingQuotesChanged(!pendingQuotesChanged);
              api(GET_USER_PROFILE_DETAILS);
            }).catch(console.warn);
          });
        }
      });
    },
    denyPendingQuotes() {
      const [, res] = api(DISABLE_QUOTE, { ids: selectedPendingQuotes.map(s => s.id).join(',') });
      res?.then(() => {
        setSelectedPendingQuotes([]);
        setPendingQuotesChanged(!pendingQuotesChanged);
        api(GET_USER_PROFILE_DETAILS);
      }).catch(console.warn);
    }
  } as PendingQuotesContextType | null;

  return <>
    <PendingQuotesContext.Provider value={pendingQuotesContext}>
      {children}
    </PendingQuotesContext.Provider>
  </>;
  
}

export default PendingQuotesProvider;