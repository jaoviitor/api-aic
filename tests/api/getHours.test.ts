import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { getDynamicTriggerHours } from "../../src/services/dynamicTriggerService";
import { createClient } from "@supabase/supabase-js";

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
                data: [
                    { id: 1, hoursCheck: '9,14,19' },
                    { id: 14, hoursCheck: '7,12,18' },
                ],
                error: null,
            }),
        }),
    }),
}));

describe('getDynamicTriggerHours', () => {
    beforeEach(() => {
        vi.clearAllMocks(); // Limpa os mocks antes de cada teste
    });

    it('should return parsed hours and IDs', async () => {
        const mockData = [
            { id: 1, hoursCheck: '9,14,19' },
            { id: 14, hoursCheck: '7,12,18' },
        ];

        const mockFrom = vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        });

        (createClient as Mock).mockReturnValue({ from: mockFrom });

        const result = await getDynamicTriggerHours();

        expect(result).toEqual([
            { id: 1, hours: [9, 14, 19] },
            { id: 14, hours: [7, 12, 18] },
        ]);
    });

    it('should throw an error if no data is returned', async () => {
        const mockFrom = vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: null, error: null }),
        });

        (createClient as Mock).mockReturnValue({ from: mockFrom });

        await expect(getDynamicTriggerHours()).rejects.toThrow('Unable to get dynamic schedules');
    });

    it('should throw an error if Supabase returns an error', async () => {
        const mockFrom = vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: null, error: 'Some error' }),
        });

        (createClient as Mock).mockReturnValue({ from: mockFrom });

        await expect(getDynamicTriggerHours()).rejects.toThrow('Unable to get dynamic schedules');
    });
});
