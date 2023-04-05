import { useMemo, useState } from "react";

import { plural, shortNSweet, IQuote, IUtilActionTypes, IQuoteActionTypes, IBookingActionTypes, IBooking, IUserProfileActionTypes } from "awayto/core";
import { storeApi, useAct, useApi, useRedux } from "awayto/hooks";

import { PendingQuotesContext, PendingQuotesContextType } from "./PendingQuotesContext";

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { SET_SNACK, OPEN_CONFIRM } = IUtilActionTypes;
const { DISABLE_QUOTE } = IQuoteActionTypes;
const { POST_BOOKING } = IBookingActionTypes;

export function PendingQuotesProvider ({ children }: IProps): JSX.Element {

  const act = useAct();
  const api = useApi();

  const [pendingQuotesChanged, setPendingQuotesChanged] = useState(false);
  const [selectedPendingQuotes, setSelectedPendingQuotes] = useState<string[]>([]);

  const { data : profile } = storeApi.useGetUserProfileDetailsQuery();
  if (!profile) return <></>;

  const pendingQuotes = useMemo(() => Object.values(profile.quotes || {}), [profile]);

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
        selectedPendingQuotes.filter(v => !pendingQuotes.map(pq => pq.id).includes(v)) :
        [...selectedPendingQuotes, ...pendingQuotes.filter(v => !selectedPendingQuotes.includes(v.id)).map(pq => pq.id)];
      
      setSelectedPendingQuotes(pendingQuotesSet);
    },
    approvePendingQuotes() {
      const selectedValues = pendingQuotes.filter(pq => selectedPendingQuotes.includes(pq.id));
      if (!selectedValues.every(s => s.slotDate === selectedValues[0].slotDate && s.scheduleBracketSlotId === selectedValues[0].scheduleBracketSlotId)) {
        act(SET_SNACK, { snackType: 'error', snackOn: 'Only appointments of the same date and time can be mass approved.' });
        return;
      }

      const { slotDate, startTime, scheduleBracketSlotId } = selectedValues[0];

      const copies = pendingQuotes.filter(q => !selectedValues.some(s => s.id === q.id)).filter(q => q.slotDate === slotDate && q.scheduleBracketSlotId === scheduleBracketSlotId);

      void act(OPEN_CONFIRM, {
        isConfirming: true,
        confirmEffect: `Approve ${plural(selectedValues.length, 'request', 'requests')}, creating ${plural(selectedValues.length, 'booking', 'bookings')}, for ${shortNSweet(slotDate, startTime)}.`,
        confirmSideEffect: !copies.length ? undefined : {
          approvalAction: 'Auto-Deny Remaining',
          approvalEffect: `Automatically deny all other requests for ${shortNSweet(slotDate, startTime)} (this cannot be undone).`,
          rejectionAction: 'Confirm Quote/Booking Only',
          rejectionEffect: 'Just submit the approvals.',
        },
        confirmAction: approval => {
          const [, res] = api(POST_BOOKING, { bookings: selectedValues.map(s => ({ quoteId: s.id, slotDate: s.slotDate, scheduleBracketSlotId: s.scheduleBracketSlotId }) as IBooking) }, { load: true });
          res?.then(() => {
            const [, rez] = api(DISABLE_QUOTE, { ids: selectedValues.concat(approval ? copies : []).map(s => s.id).join(',') });
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
      const [, res] = api(DISABLE_QUOTE, { ids: selectedPendingQuotes.join(',') });
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