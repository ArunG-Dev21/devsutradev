import type { CustomerFragment } from 'customer-accountapi.generated';
import type { CustomerUpdateInput } from '@shopify/hydrogen/customer-account-api-types';
import { CUSTOMER_UPDATE_MUTATION } from '~/graphql/customer-account/CustomerUpdateMutation';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import type { Route } from './+types/($locale).account.profile';

export type ActionResponse = {
  error: string | null;
  customer: CustomerFragment | null;
};

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Profile' }];
};

export async function loader({ context }: Route.LoaderArgs) {
  context.customerAccount.handleAuthStatus();
  return {};
}

export async function action({ request, context }: Route.ActionArgs) {
  const { customerAccount } = context;

  if (request.method !== 'PUT') {
    return data({ error: 'Method not allowed' }, { status: 405 });
  }

  const form = await request.formData();

  try {
    const customer: CustomerUpdateInput = {};
    const validInputKeys = ['firstName', 'lastName'] as const;
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key as any)) continue;
      if (typeof value === 'string' && value.length) {
        customer[key as (typeof validInputKeys)[number]] = value;
      }
    }

    const { data: mutationData, errors } = await customerAccount.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customer,
          language: customerAccount.i18n.language,
        },
      },
    );

    if (errors?.length) throw new Error(errors[0].message);
    if (!mutationData?.customerUpdate?.customer) {
      throw new Error('Customer profile update failed.');
    }

    return { error: null, customer: mutationData?.customerUpdate?.customer };
  } catch (error: any) {
    return data({ error: error.message, customer: null }, { status: 400 });
  }
}

export default function AccountProfile() {
  const account = useOutletContext<{ customer: CustomerFragment }>();
  const { state } = useNavigation();
  const action = useActionData<ActionResponse>();
  const customer = action?.customer ?? account?.customer;
  const isUpdating = state !== 'idle';
  const saved = action !== undefined && action.error === null;

  const inputClass =
    'w-full px-0 py-3 bg-transparent text-foreground border-b border-border focus:outline-none focus:border-foreground transition-colors rounded-none placeholder:text-muted-foreground text-sm';
  const labelClass =
    'block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5';

  return (
    <div className="max-w-xl">
      <div className="mb-8 pb-6 border-b border-border">
        <h2 className="text-2xl font-heading font-medium text-foreground tracking-tight">
          Personal Information
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Update your contact details.
        </p>
      </div>

      {/* Read-only email */}
      <div className="mb-8 p-4 rounded-xl border border-border bg-muted/20">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Email</p>
        <p className="text-sm text-foreground">{account?.customer?.emailAddress?.emailAddress}</p>
      </div>

      <Form method="PUT" className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label htmlFor="firstName" className={labelClass}>First name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              defaultValue={customer.firstName ?? ''}
              minLength={2}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>Last name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Last name"
              defaultValue={customer.lastName ?? ''}
              minLength={2}
              className={inputClass}
            />
          </div>
        </div>

        {action?.error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p>{action.error}</p>
          </div>
        )}

        {saved && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100 flex items-center gap-3">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Profile updated successfully.
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-8 py-3 bg-foreground text-background text-[11px] font-semibold tracking-widest uppercase rounded-full hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Form>
    </div>
  );
}
