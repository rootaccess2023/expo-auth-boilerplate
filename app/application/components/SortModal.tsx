import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { IconCheck } from "@tabler/icons-react-native";
import { forwardRef, useCallback } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, Hamburg } from "@/assets/fonts/sharedStyles";

export type SortOption = "newest" | "oldest" | "az" | "za";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az",     label: "A → Z" },
  { value: "za",     label: "Z → A" },
];

type Props = {
  sortOption: SortOption;
  onSelect: (option: SortOption) => void;
};

const SortModal = forwardRef<BottomSheetModal, Props>(
  ({ sortOption, onSelect }, ref) => {
    const insets = useSafeAreaInsets();

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.background}
      >
        <BottomSheetView
          style={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <Text style={styles.title}>Sort by</Text>
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortOption === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={styles.option}
                onPress={() => onSelect(opt.value)}
              >
                <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
                {isActive && (
                  <IconCheck size={18} color={color.PRIMARY} strokeWidth={2.5} />
                )}
              </Pressable>
            );
          })}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

SortModal.displayName = "SortModal";

export default SortModal;

const styles = StyleSheet.create({
  handle: { backgroundColor: "#E0E0E0", width: 36 },
  background: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontFamily: Hamburg.BOLD,
    fontSize: 18,
    color: "#1a1a2e",
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  optionLabel: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 16,
    color: "#1a1a2e",
  },
  optionLabelActive: {
    fontFamily: Hamburg.MEDIUM,
    color: color.PRIMARY,
  },
});
