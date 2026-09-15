import { CharacterChipFragment } from './CharacterChip.graphql';
import styles from './CharacterChip.module.css';
import { type FragmentType, getFragmentData } from '../../gql';

type Props = {
  character: FragmentType<typeof CharacterChipFragment>;
};

export function CharacterChip({ character }: Props) {
  // Named getFragmentData rather than the codegen default `useFragment`: it is a
  // plain unmasking function, not a React hook, and shouldn't read like one.
  const data = getFragmentData(CharacterChipFragment, character);

  return (
    <span className={styles.chip}>
      {data.image ? (
        <img className={styles.avatar} src={data.image} alt="" width={24} height={24} />
      ) : null}
      <span className={styles.name}>{data.name}</span>
      {data.species ? <span className={styles.species}>{data.species}</span> : null}
    </span>
  );
}
