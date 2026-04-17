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
    const addressId = form.has('addressId') ? String(form.get('addressId')) : null;
    if (!addressId) throw new Error('You must provide an address id.');

    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data({ error: { [addressId]: 'Unauthorized' } }, { status: 401 });
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;

    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1', 'address2', 'city', 'company', 'territoryCode',
      'firstName', 'lastName', 'phoneNumber', 'zoneCode', 'zip',
    ];
    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') address[key] = value;
    }

    switch (request.method) {
      case 'POST': {
        try {
          const { data: d, errors } = await customerAccount.mutate(CREATE_ADDRESS_MUTATION, {
            variables: { address, defaultAddress, language: customerAccount.i18n.language },
          });
          if (errors?.length) throw new Error(errors[0].message);
          if (d?.customerAddressCreate?.userErrors?.length)
            throw new Error(d?.customerAddressCreate?.userErrors[0].message);
          if (!d?.customerAddressCreate?.customerAddress)
            throw new Error('Customer address create failed.');
          return { error: null, createdAddress: d?.customerAddressCreate?.customerAddress, defaultAddress };
        } catch (error: unknown) {
          return data({ error: { [addressId]: error instanceof Error ? error.message : error } }, { status: 400 });
        }
      }
      case 'PUT': {
        try {
          const { data: d, errors } = await customerAccount.mutate(UPDATE_ADDRESS_MUTATION, {
            variables: { address, addressId: decodeURIComponent(addressId), defaultAddress, language: customerAccount.i18n.language },
          });
          if (errors?.length) throw new Error(errors[0].message);
          if (d?.customerAddressUpdate?.userErrors?.length)
            throw new Error(d?.customerAddressUpdate?.userErrors[0].message);
          if (!d?.customerAddressUpdate?.customerAddress)
            throw new Error('Customer address update failed.');
          return { error: null, updatedAddress: address, defaultAddress };
        } catch (error: unknown) {
          return data({ error: { [addressId]: error instanceof Error ? error.message : error } }, { status: 400 });
        }
      }
      case 'DELETE': {
        try {
          const { data: d, errors } = await customerAccount.mutate(DELETE_ADDRESS_MUTATION, {
            variables: { addressId: decodeURIComponent(addressId), language: customerAccount.i18n.language },
          });
          if (errors?.length) throw new Error(errors[0].message);
          if (d?.customerAddressDelete?.userErrors?.length)
            throw new Error(d?.customerAddressDelete?.userErrors[0].message);
          if (!d?.customerAddressDelete?.deletedAddressId)
            throw new Error('Customer address delete failed.');
          return { error: null, deletedAddress: addressId };
        } catch (error: unknown) {
          return data({ error: { [addressId]: error instanceof Error ? error.message : error } }, { status: 400 });
        }
      }
      default:
        return data({ error: { [addressId]: 'Method not allowed' } }, { status: 405 });
    }
  } catch (error: unknown) {
    return data({ error: error instanceof Error ? error.message : error }, { status: 400 });
  }
}

export default function Addresses() {
  const { customer } = useOutletContext<{ customer: CustomerFragment }>();
  const { defaultAddress, addresses } = customer;

  return (
    <div>
      <div className="mb-8 pb-6 border-b border-border">
        <h2 className="text-2xl font-heading font-medium text-foreground tracking-tight">
          Your Addresses
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Manage the locations where your items will be delivered.
        </p>
      </div>

      <div className="space-y-10">
        {/* Saved Addresses */}
        {addresses.nodes.length > 0 ? (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              Saved Addresses
            </h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {addresses.nodes.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  isDefault={defaultAddress?.id === address.id}
                  defaultAddress={defaultAddress}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-border rounded-2xl">
            <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
          </div>
        )}

        {/* Add New Address */}
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-5">
            Add a New Address
          </h3>
          <div className="rounded-2xl border border-border p-5 sm:p-7">
            <NewAddressForm />
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressCard({
  address,
  isDefault,
  defaultAddress,
}: {
  address: AddressFragment;
  isDefault: boolean;
  defaultAddress: CustomerFragment['defaultAddress'];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 relative">
      {isDefault && (
        <span className="absolute top-0 right-0 bg-foreground text-background text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-tr-2xl rounded-bl-xl">
          Default
        </span>
      )}

      <address className="not-italic mb-4">
        <p className="font-semibold text-foreground text-sm">
          {address.firstName} {address.lastName}
        </p>
        {address.company && (
          <p className="text-muted-foreground text-sm mt-0.5">{address.company}</p>
        )}
        <p className="text-muted-foreground text-sm mt-1">{address.address1}</p>
        {address.address2 && (
          <p className="text-muted-foreground text-sm">{address.address2}</p>
        )}
        <p className="text-muted-foreground text-sm">
          {address.city}{address.zoneCode ? `, ${address.zoneCode}` : ''} {address.zip}
        </p>
        <p className="text-muted-foreground text-sm">{address.territoryCode}</p>
        {address.phoneNumber && (
          <p className="text-muted-foreground text-sm mt-1">{address.phoneNumber}</p>
        )}
      </address>

      <details className="group/details">
        <summary className="list-none cursor-pointer">
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground group-open/details:hidden">
              Edit Address
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground hidden group-open/details:block">
              Close Editor
            </span>
            <svg
              className="w-3 h-3 text-muted-foreground ml-auto transition-transform group-open/details:rotate-180"
              fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </summary>

        <div className="mt-6 pt-6 border-t border-border">
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
                  className="px-5 py-2.5 bg-foreground text-background text-[11px] font-semibold tracking-widest uppercase rounded-full hover:opacity-85 transition-opacity disabled:opacity-50"
                >
                  {stateForMethod('PUT') !== 'idle' ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  disabled={stateForMethod('DELETE') !== 'idle'}
                  formMethod="DELETE"
                  type="submit"
                  className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 text-[11px] font-semibold tracking-widest uppercase rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {stateForMethod('DELETE') !== 'idle' ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </AddressForm>
        </div>
      </details>
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '', address2: '', city: '', company: '',
    territoryCode: '', firstName: '', id: 'new',
    lastName: '', phoneNumber: '', zoneCode: '', zip: '',
  } as CustomerAddressInput;

  return (
    <AddressForm addressId={'NEW_ADDRESS_ID'} address={newAddress} defaultAddress={null}>
      {({ stateForMethod }) => (
        <div className="mt-6 flex justify-end">
          <button
            disabled={stateForMethod('POST') !== 'idle'}
            formMethod="POST"
            type="submit"
            className="px-6 py-3 bg-foreground text-background text-[11px] font-semibold tracking-widest uppercase rounded-full hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stateForMethod('POST') !== 'idle' ? 'Adding...' : 'Add Address'}
          </button>
        </div>
      )}
    </AddressForm>
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

  const inputClass =
    'w-full px-0 py-3 bg-transparent text-foreground border-b border-border focus:outline-none focus:border-foreground transition-colors rounded-none placeholder:text-muted-foreground text-sm';
  const labelClass =
    'block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5';

  return (
    <Form id={addressId} className="space-y-6">
      <input type="hidden" name="addressId" defaultValue={addressId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor={`firstName-${addressId}`} className={labelClass}>First name *</label>
          <input
            id={`firstName-${addressId}`}
            name="firstName" type="text" required
            autoComplete="given-name" placeholder="First name"
            defaultValue={address?.firstName ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`lastName-${addressId}`} className={labelClass}>Last name *</label>
          <input
            id={`lastName-${addressId}`}
            name="lastName" type="text" required
            autoComplete="family-name" placeholder="Last name"
            defaultValue={address?.lastName ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`company-${addressId}`} className={labelClass}>Company</label>
        <input
          id={`company-${addressId}`}
          name="company" type="text"
          autoComplete="organization" placeholder="Company"
          defaultValue={address?.company ?? ''}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`address1-${addressId}`} className={labelClass}>Address line 1 *</label>
        <input
          id={`address1-${addressId}`}
          name="address1" type="text" required
          autoComplete="address-line1" placeholder="Address line 1"
          defaultValue={address?.address1 ?? ''}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`address2-${addressId}`} className={labelClass}>Address line 2</label>
        <input
          id={`address2-${addressId}`}
          name="address2" type="text"
          autoComplete="address-line2" placeholder="Apartment, suite, etc."
          defaultValue={address?.address2 ?? ''}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor={`city-${addressId}`} className={labelClass}>City *</label>
          <input
            id={`city-${addressId}`}
            name="city" type="text" required
            autoComplete="address-level2" placeholder="City"
            defaultValue={address?.city ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`zoneCode-${addressId}`} className={labelClass}>State / Province *</label>
          <input
            id={`zoneCode-${addressId}`}
            name="zoneCode" type="text" required
            autoComplete="address-level1" placeholder="State / Province"
            defaultValue={address?.zoneCode ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor={`zip-${addressId}`} className={labelClass}>Postal Code *</label>
          <input
            id={`zip-${addressId}`}
            name="zip" type="text" required
            autoComplete="postal-code" placeholder="Zip / Postal Code"
            defaultValue={address?.zip ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`territoryCode-${addressId}`} className={labelClass}>Country Code *</label>
          <input
            id={`territoryCode-${addressId}`}
            name="territoryCode" type="text" required
            maxLength={2}
            autoComplete="country" placeholder="IN, US, CA..."
            defaultValue={address?.territoryCode ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`phoneNumber-${addressId}`} className={labelClass}>Phone Number</label>
        <input
          id={`phoneNumber-${addressId}`}
          name="phoneNumber" type="tel"
          pattern="^\+?[1-9]\d{3,14}$"
          autoComplete="tel" placeholder="+1234567890"
          defaultValue={address?.phoneNumber ?? ''}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <input
          id={`defaultAddress-${addressId}`}
          name="defaultAddress"
          type="checkbox"
          defaultChecked={isDefaultAddress}
          className="rounded border-border text-foreground h-4 w-4 cursor-pointer"
        />
        <label
          htmlFor={`defaultAddress-${addressId}`}
          className="text-sm text-foreground cursor-pointer select-none"
        >
          Set as default address
        </label>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {children({
        stateForMethod: (method) => (formMethod === method ? state : 'idle'),
      })}
    </Form>
  );
}
