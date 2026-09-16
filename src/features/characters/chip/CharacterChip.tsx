import { type FragmentType, getFragmentData } from '../../../graphql/generated';
import { CharacterChipFragment } from './CharacterChip.graphql';
import styles from './CharacterChip.module.css';
import { describeCharacter } from '../describeCharacter';

type Props = {
  character: FragmentType<typeof CharacterChipFragment>;
};

export function CharacterChip({ character }: Props) {
  const data = getFragmentData(CharacterChipFragment, character);
  const { detail } = describeCharacter(data);

  return (
    <span className={styles.chip}>
      {data.image ? (
        <img className={styles.avatar} src={data.image} alt="" width={24} height={24} />
      ) : null}
      <span className={styles.name}>{data.name}</span>
      {detail ? <span className={styles.detail}>{detail}</span> : null}
    </span>
  );
}
