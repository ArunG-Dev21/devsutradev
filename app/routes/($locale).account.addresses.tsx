import type { CustomerAddressInput } from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type Fetcher,
} from 'react-router';
import type { Route } from './+types/($locale).account.addresses';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressFragment['id'], string> | null;
  updatedAddress?: AddressFragment;
};

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Addresses' }];
};

export async function loader({ context }: Route.LoaderArgs) {
  context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({ request, context }: Route.ActionArgs) {
  const { customerAccount } = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    // this will ensure redirecting to login never happen for mutatation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        { error: { [addressId]: 'Unauthorized' } },
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const { data, errors } = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              { error: { [addressId]: error.message } },
              {
                status: 400,
              },
            );
          }
          return data(
            { error: { [addressId]: error } },
            {
              status: 400,
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const { data, errors } = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              { error: { [addressId]: error.message } },
              {
                status: 400,
              },
            );
          }
          return data(
            { error: { [addressId]: error } },
            {
              status: 400,
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const { data, errors } = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return { error: null, deletedAddress: addressId };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              { error: { [addressId]: error.message } },
              {
                status: 400,
              },
            );
          }
          return data(
            { error: { [addressId]: error } },
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return data(
          { error: { [addressId]: 'Method not allowed' } },
          {
            status: 405,
          },
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return data(
        { error: error.message },
        {
          status: 400,
        },
      );
    }
    return data(
      { error },
      {
        status: 400,
      },
    );
  }
}

export default function Addresses() {
  const { customer } = useOutletContext<{ customer: CustomerFragment }>();
  const { defaultAddress, addresses } = customer;

  return (
    <div className="account-addresses">
      <div className="mb-10 border-b border-stone-200 pb-6">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Your Addresses</h2>
        <p className="text-sm text-stone-500 mt-2">
          Manage the locations where your sacred items will be delivered.
        </p>
      </div>

      <div className="space-y-12">
        {/* Add New Address Section */}
        <div>
          <h3 className="text-lg font-bold text-stone-900 mb-6">Add a New Address</h3>
          <div className="bg-stone-50/80 rounded-3xl p-6 sm:p-8">
            <NewAddressForm />
          </div>
        </div>

        {/* Existing Addresses Section */}
        {addresses.nodes.length > 0 ? (
          <div>
            <h3 className="text-lg font-bold text-stone-900 mb-6">Saved Addresses</h3>
            <ExistingAddresses
              addresses={addresses}
              defaultAddress={defaultAddress}
            />
          </div>
        ) : (
          <div className="p-8 text-center bg-muted rounded-2xl border border-border border-dashed">
            <p className="text-stone-500">You haven&apos;t saved any addresses yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  } as CustomerAddressInput;

  return (
    <AddressForm
      addressId={'NEW_ADDRESS_ID'}
      address={newAddress}
      defaultAddress={null}
    >
      {({ stateForMethod }) => (
        <div className="mt-6 flex justify-end">
          <button
            disabled={stateForMethod('POST') !== 'idle'}
            formMethod="POST"
            type="submit"
            className="px-6 py-3 bg-black text-white text-xs font-semibold tracking-[0.15em] uppercase rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stateForMethod('POST') !== 'idle' ? 'Adding Address...' : 'Add Address'}
          </button>
        </div>
      )}
    </AddressForm>
  );
}

function ExistingAddresses({
  addresses,
  defaultAddress,
}: Pick<CustomerFragment, 'addresses' | 'defaultAddress'>) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {addresses.nodes.map((address) => (
        <div key={address.id} className="bg-stone-50/80 rounded-3xl p-6 sm:p-8 relative group overflow-hidden">
          {defaultAddress?.id === address.id && (
            <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-bl-2xl">
              Default
            </div>
          )}

          <details className="group/details">
            <summary className="list-none cursor-pointer">
              <div className="mb-4">
                <p className="font-semibold text-stone-900">{address.firstName} {address.lastName}</p>
                {address.company && <p className="text-stone-600 text-sm mt-1">{address.company}</p>}
                <p className="text-stone-500 text-sm mt-1">{address.address1}</p>
                {address.address2 && <p className="text-stone-500 text-sm mt-1">{address.address2}</p>}
                <p className="text-stone-500 text-sm mt-1">{address.city}, {address.zoneCode} {address.zip}</p>
                <p className="text-stone-500 text-sm mt-1">{address.territoryCode}</p>
                {address.phoneNumber && <p className="text-stone-500 text-sm mt-1">{address.phoneNumber}</p>}
              </div>

              <div className="mt-4 flex items-center justify-between pt-6 border-t border-stone-200">
                <span className="text-xs font-semibold text-stone-900 group-open/details:hidden underline hover:text-stone-600 transition-colors">Edit Address</span>
                <span className="text-xs font-semibold text-stone-900 hidden group-open/details:block underline hover:text-stone-600 transition-colors">Close Editor</span>
              </div>
            </summary>

            <div className="mt-8 pt-8 border-t border-stone-200">
              <AddressForm
                addressId={address.id}
                address={address}
                defaultAddress={defaultAddress}
              >
                {({ stateForMethod }) => (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      disabled={stateForMethod('PUT') !== 'idle'}
                      formMethod="PUT"
                      type="submit"
                      className="px-5 py-2.5 bg-black text-white text-xs font-semibold tracking-widest uppercase rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {stateForMethod('PUT') !== 'idle' ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      disabled={stateForMethod('DELETE') !== 'idle'}
                      formMethod="DELETE"
                      type="submit"
                      className="px-5 py-2.5 bg-red-50 text-red-600 text-xs font-semibold tracking-widest uppercase rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {stateForMethod('DELETE') !== 'idle' ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </AddressForm>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
  children: (props: {
    stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
  }) => React.ReactNode;
}) {
  const { state, formMethod } = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;

  const inputClass = "w-full px-0 py-3 bg-transparent text-stone-900 border-b border-stone-200 focus:outline-none focus:border-black transition-colors rounded-none placeholder:text-stone-400";
  const labelClass = "block text-xs font-semibold text-stone-700 uppercase tracking-widest";

  return (
    <Form id={addressId} className="space-y-6">
      <input type="hidden" name="addressId" defaultValue={addressId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label htmlFor={`firstName-${addressId}`} className={labelClass}>First name*</label>
          <input
            id={`firstName-${addressId}`}
            name="firstName"
            type="text"
            required
            aria-label="First name"
            autoComplete="given-name"
            placeholder="First name"
            defaultValue={address?.firstName ?? ''}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`lastName-${addressId}`} className={labelClass}>Last name*</label>
          <input
            id={`lastName-${addressId}`}
            name="lastName"
            type="text"
            required
            aria-label="Last name"
            autoComplete="family-name"
            placeholder="Last name"
            defaultValue={address?.lastName ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={`company-${addressId}`} className={labelClass}>Company</label>
        <input
          id={`company-${addressId}`}
          name="company"
          type="text"
          aria-label="Company"
          autoComplete="organization"
          placeholder="Company"
          defaultValue={address?.company ?? ''}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={`address1-${addressId}`} className={labelClass}>Address line 1*</label>
        <input
          id={`address1-${addressId}`}
          name="address1"
          type="text"
          required
          aria-label="Address line 1"
          autoComplete="address-line1"
          placeholder="Address line 1"
          defaultValue={address?.address1 ?? ''}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={`address2-${addressId}`} className={labelClass}>Address line 2</label>
        <input
          id={`address2-${addressId}`}
          name="address2"
          type="text"
          aria-label="Address line 2"
          autoComplete="address-line2"
          placeholder="Apartment, suite, etc."
          defaultValue={address?.address2 ?? ''}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label htmlFor={`city-${addressId}`} className={labelClass}>City*</label>
          <input
            id={`city-${addressId}`}
            name="city"
            type="text"
            required
            aria-label="City"
            autoComplete="address-level2"
            placeholder="City"
            defaultValue={address?.city ?? ''}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`zoneCode-${addressId}`} className={labelClass}>State / Province*</label>
          <input
            id={`zoneCode-${addressId}`}
            name="zoneCode"
            type="text"
            required
            aria-label="State/Province"
            autoComplete="address-level1"
            placeholder="State / Province"
            defaultValue={address?.zoneCode ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label htmlFor={`zip-${addressId}`} className={labelClass}>Zip / Postal Code*</label>
          <input
            id={`zip-${addressId}`}
            name="zip"
            type="text"
            required
            aria-label="Zip"
            autoComplete="postal-code"
            placeholder="Zip Code"
            defaultValue={address?.zip ?? ''}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`territoryCode-${addressId}`} className={labelClass}>Country Code*</label>
          <input
            id={`territoryCode-${addressId}`}
            name="territoryCode"
            type="text"
            required
            maxLength={2}
            aria-label="Country Code"
            autoComplete="country"
            placeholder="US, CA, etc."
            defaultValue={address?.territoryCode ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={`phoneNumber-${addressId}`} className={labelClass}>Phone Number</label>
        <input
          id={`phoneNumber-${addressId}`}
          name="phoneNumber"
          type="tel"
          pattern="^\+?[1-9]\d{3,14}$"
          aria-label="Phone Number"
          autoComplete="tel"
          placeholder="+1234567890"
          defaultValue={address?.phoneNumber ?? ''}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-2.5 pt-2">
        <input
          id={`defaultAddress-${addressId}`}
          name="defaultAddress"
          type="checkbox"
          defaultChecked={isDefaultAddress}
          className="rounded border-neutral-300 text-stone-900 focus:ring-stone-900 h-4 w-4 cursor-pointer"
        />
        <label htmlFor={`defaultAddress-${addressId}`} className="text-sm text-stone-700 cursor-pointer select-none">
          Set as default address
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 mt-4">
          <p>{error}</p>
        </div>
      )}

      {children({
        stateForMethod: (method) => (formMethod === method ? state : 'idle'),
      })}
    </Form>
  );
}
