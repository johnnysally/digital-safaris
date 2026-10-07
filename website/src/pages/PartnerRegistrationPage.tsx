import React, { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Building2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { registerPartnerByType } from '../api/partnerApi';
import { api } from '../api/axios';

type BusinessType = 'transport' | 'restaurant' | 'accommodation' | '';

const businessTypes = [
    {
        id: 'accommodation' as const,
        title: 'Accommodation',
        description: 'Hotels, BnBs, apartments, lodges, guest houses.',
        icon: '🏨',
    },
    {
        id: 'restaurant' as const,
        title: 'Restaurant',
        description: 'Restaurants, cafes, food businesses, delivery kitchens.',
        icon: '🍽️',
    },
    {
        id: 'transport' as const,
        title: 'Transport',
        description: 'Taxi, ride-hailing, shuttles, buses, car rentals.',
        icon: '🚗',
    },
];

const transportTypes = ['ride_hailing', 'taxi', 'shuttle', 'bus', 'car_rental'];
const cuisines = ['african', 'italian', 'chinese', 'indian', 'fast_food', 'seafood', 'other'];

type FormData = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    businessName: string;
    businessType: string;
    cuisine: string;
    towns: string[];
};

const initialForm: FormData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    businessType: 'ride_hailing',
    cuisine: '',
    towns: [],
};

interface TownOption {
    _id: string;
    name: string;
}

export const PartnerRegistrationPage: React.FC = () => {
    const config = useSiteConfig();
    const [step, setStep] = useState<'type' | 'form'>('type');
    const [selectedType, setSelectedType] = useState<BusinessType>('');
    const [formData, setFormData] = useState<FormData>(initialForm);
    const [towns, setTowns] = useState<TownOption[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api
            .get('/public/site')
            .then((res) => {
                const data = res.data?.data ?? res.data;
                const locations = Array.isArray(data.locations) ? data.locations : [];
                setTowns(
                    locations.map((l: { _id: string; name: string }) => ({
                        _id: l._id,
                        name: l.name,
                    }))
                );
            })
            .catch(() => {});
    }, []);

    const handleChange = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleTown = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            towns: prev.towns.includes(id)
                ? prev.towns.filter((t) => t !== id)
                : [...prev.towns, id],
        }));
    };

    const handleTypeSelect = (type: BusinessType) => {
        setSelectedType(type);
        setStep('form');
        setError('');
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (!selectedType) {
            setError('Please choose a business type.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        try {
            setSubmitting(true);

            const payload: Record<string, unknown> = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                businessName: formData.businessName,
                towns: formData.towns,
            };

            if (selectedType === 'transport') {
                payload.businessType = formData.businessType;
            } else if (selectedType === 'restaurant') {
                payload.cuisine = formData.cuisine;
            }

            await registerPartnerByType(selectedType, payload as never);
            setSubmitted(true);
        } catch (submitError: unknown) {
            const err = submitError as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "We couldn't submit your application right now. Please try again.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        const loginUrl = config?.app_links?.partner_landing;
        return (
            <div className="bg-[#f9f7f4] min-h-screen text-[#191816] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#f4efe8] flex items-center justify-center text-[#c47c2b] mb-6">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold">Application received.</h1>
                    <p className="mt-3 text-sm text-[#5e5950] max-w-sm mx-auto leading-relaxed">
                        Thanks for registering with {config?.site_name || 'DigitalSafaris'}. Our team will review your application and notify you once approved.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        {loginUrl && (
                            <a
                                href={String(loginUrl)}
                                className="inline-flex items-center gap-2 bg-[#c47c2b] hover:bg-[#b06d20] text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-full transition-colors"
                            >
                                Go to partner portal
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        )}
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 border border-[#dcd3c7] text-[#191816] text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-full hover:bg-[#eae3d9] transition-colors"
                        >
                            Return home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f9f7f4] min-h-screen text-[#191816] pt-32 pb-20">
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    to="/businesses"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5e5950] hover:text-[#c47c2b] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to partners
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mt-10 items-start">
                    <div className="lg:col-span-5 lg:sticky lg:top-32">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#eae3d9] text-[#191816] text-xs font-bold uppercase tracking-wider mb-6">
                            <Building2 className="w-4 h-4 text-[#c47c2b]" />
                            Partner registration
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
                            Bring your business to <span className="text-[#c47c2b]">{config?.site_name || 'DigitalSafaris'}.</span>
                        </h1>
                        <p className="mt-6 text-base sm:text-lg text-[#5e5950] leading-relaxed max-w-md">
                            Register your business directly and start receiving customers once approved.
                        </p>
                        <div className="mt-10 border-t border-[#e6dfd5] pt-6 space-y-4 text-sm text-[#5e5950]">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[#c47c2b] shrink-0" />
                                <span>Reach travelers looking for trusted local services.</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[#c47c2b] shrink-0" />
                                <span>Manage bookings, listings, and availability in one place.</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[#c47c2b] shrink-0" />
                                <span>Our team will contact you after reviewing your details.</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 bg-white rounded-3xl border border-[#e6dfd5] p-6 sm:p-10 shadow-sm">
                        {step === 'type' ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-extrabold">Choose your business type</h2>
                                    <p className="mt-2 text-sm text-[#5e5950]">Select the option that best describes your business.</p>
                                </div>
                                <div className="space-y-3">
                                    {businessTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => handleTypeSelect(type.id)}
                                            className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#e6dfd5] hover:border-[#c47c2b] hover:bg-[#faf6f0] transition-all text-left group"
                                        >
                                            <span className="text-4xl">{type.icon}</span>
                                            <div className="flex-1">
                                                <p className="font-bold text-lg">{type.title}</p>
                                                <p className="text-sm text-[#5e5950]">{type.description}</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-[#c47c2b] group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <button
                                    type="button"
                                    onClick={() => setStep('type')}
                                    className="text-xs font-bold uppercase tracking-wider text-[#5e5950] hover:text-[#c47c2b] inline-flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Change business type
                                </button>

                                <div>
                                    <h2 className="text-2xl font-extrabold">Register as {selectedType}</h2>
                                    <p className="mt-2 text-sm text-[#5e5950]">A few details is all we need to get started.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <label className="space-y-2 text-sm font-semibold">
                                        First name
                                        <input
                                            required
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => handleChange('firstName', e.target.value)}
                                            placeholder="First name"
                                            className="w-full rounded-xl border border-[#dcd3c7] bg-[#f9f7f4] px-4 py-3 text-sm font-normal outline-none focus:border-[#c47c2b] focus:ring-2 focus:ring-[#c47c2b]/20 transition"
                                        />
                                    </label>
                                    <label className="space-y-2 text-sm font-semibold">
                                        Last name
                                        <input
                                            required
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => handleChange('lastName', e.target.value)}
                                            placeholder="Last name"
                                            className="w-full rounded-xl border border-[#dcd3c7] bg-[#f9f7f4] px-4 py-3 text-sm font-normal outline-none focus:border-[#c47c2b] focus:ring-2 focus:ring-[#c47c2b]/20 transition"
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <label className="space-y-2 text-sm font-semibold">
                                        Email
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            placeholder="you@business.com"
                                            className="w-full rounded-xl border border-[#dcd3c7] bg-[#f9f7f4] px-4 py-3 text-sm font-normal outline-none focus:border-[#c47c2b] focus:ring-2 focus:ring-[#c47c2b]/20 transition"
                                        />
                                    </label>
                                    <label className="space-y-2 text-sm font-semibold">
                                        Phone
                                        <input
                                            required
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            placeholder="+254 700 000 000"
                                            className="w-full rounded-xl border border-[#dcd3c7] bg-[#f9f7f4] px-4 py-3 text-sm font-normal outline-none focus:border-[#c47c2b] focus:ring-2 focus:ring-[#c47c2b]/20 transition"
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <label className="space-y-2 text-sm font-semibold">
                                        Business name
                                        <input
                                            required
                                            type="text"
                                            value={formData.businessName}
                                            onChange={(e) => handleChange('businessName', e.target.value)}
                                            placeholder="Business name"
                                            className="w-full rounded-xl border border-[#dcd3c7] bg-[#f9f7f4] px-4 py-3 text-sm font-normal outline-none focus:border-[#c47c2b] focus:ring-2 focus:ring-[#c47c2b]/20 transition"
                                        />
                                    </label>
                                    <label className="space-y-2 text-sm font-semibold">
                                        Password
                                        <input
                                            required
                                            minLength={6}
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => handleChange('password', e.target.value)}
                                            placeholder="At least 6 characters"
                                            className="w-full rounded-xl border border-[#dcd3c7] bg-[#f9f7f4] px-4 py-3 text-sm font-normal outline-none focus:border-[#c47c2b] focus:ring-2 focus:ring-[#c47c2b]/20 transition"
                                        />
                                    </label>
                                </div>

                                {selectedType === 'transport' && (
                                    <label className="space-y-2 text-sm font-semibold block">
                                        Transport type
                                        <select
                                            required
                                            value={formData.businessType}
                                            onChange={(e) => handleChange('businessType', e.target.value)}
                                            className="w-full rounded-xl border border-[#dcd3c7] bg-[#f9f7f4] px-4 py-3 text-sm font-normal outline-none focus:border-[#c47c2b] focus:ring-2 focus:ring-[#c47c2b]/20 transition"
                                        >
                                            {transportTypes.map((t) => (
                                                <option key={t} value={t}>
                                                    {t.replace('_', ' ')}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                {selectedType === 'restaurant' && (
                                    <label className="space-y-2 text-sm font-semibold block">
                                        Food type
                                        <select
                                            required
                                            value={formData.cuisine}
                                            onChange={(e) => handleChange('cuisine', e.target.value)}
                                            className="w-full rounded-xl border border-[#dcd3c7] bg-[#f9f7f4] px-4 py-3 text-sm font-normal outline-none focus:border-[#c47c2b] focus:ring-2 focus:ring-[#c47c2b]/20 transition"
                                        >
                                            <option value="">Select food type</option>
                                            {cuisines.map((c) => (
                                                <option key={c} value={c}>
                                                    {c.replace('_', ' ')}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                <div>
                                    <span className="text-sm font-semibold block mb-2">Towns you serve</span>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                        {towns.length === 0 && (
                                            <p className="text-xs text-[#8e877e]">
                                                No towns available. Please try again shortly.
                                            </p>
                                        )}
                                        {towns.map((t) => (
                                            <button
                                                key={t._id}
                                                type="button"
                                                onClick={() => toggleTown(t._id)}
                                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                                    formData.towns.includes(t._id)
                                                        ? 'bg-[#c47c2b] text-white'
                                                        : 'bg-[#eae3d9] text-[#5e5950] hover:bg-[#dcd3c7]'
                                                }`}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-[#c47c2b] hover:bg-[#b06d20] disabled:cursor-not-allowed disabled:opacity-70 text-white text-xs font-bold uppercase tracking-wider px-6 py-4 rounded-full transition-colors"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create partner account
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-[#8e877e]">
                                    By submitting, you agree to the partner terms and conditions.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};