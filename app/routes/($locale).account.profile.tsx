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
      if (!validInputKeys.includes(key as any)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        customer[key as (typeof validInputKeys)[number]] = value;
      }
    }

    // update customer and possibly password
    const { data, errors } = await customerAccount.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customer,
          language: customerAccount.i18n.language,
        },
      },
    );

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    if (!data?.customerUpdate?.customer) {
      throw new Error('Customer profile update failed.');
    }

    return {
      error: null,
      customer: data?.customerUpdate?.customer,
    };
  } catch (error: any) {
    return data(
      { error: error.message, customer: null },
      {
        status: 400,
      },
    );
  }
}

export default function AccountProfile() {
  const account = useOutletContext<{ customer: CustomerFragment }>();
  const { state } = useNavigation();
  const action = useActionData<ActionResponse>();
  const customer = action?.customer ?? account?.customer;
  const isUpdating = state !== 'idle';

  return (
    <div className="max-w-2xl">
      <div className="mb-8 border-b border-stone-200 pb-6">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Personal Information</h2>
        <p className="text-sm text-stone-500 mt-2">
          Update your contact details to keep your account secure.
        </p>
      </div>

      <Form method="PUT" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-xs font-semibold text-stone-700 uppercase tracking-widest">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              aria-label="First name"
              defaultValue={customer.firstName ?? ''}
              minLength={2}
              className="w-full px-0 py-3 bg-transparent text-stone-900 border-b border-stone-200 focus:outline-none focus:border-black transition-colors rounded-none placeholder:text-stone-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-xs font-semibold text-stone-700 uppercase tracking-widest">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Last name"
              aria-label="Last name"
              defaultValue={customer.lastName ?? ''}
              minLength={2}
              className="w-full px-0 py-3 bg-transparent text-stone-900 border-b border-stone-200 focus:outline-none focus:border-black transition-colors rounded-none placeholder:text-stone-400"
            />
          </div>
        </div>

        {action?.error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{action.error}</p>
          </div>
        )}

        <div className="pt-8 flex items-center">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-8 py-3.5 bg-black text-white text-xs font-semibold tracking-widest uppercase rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Form>
    </div>
  );
}
