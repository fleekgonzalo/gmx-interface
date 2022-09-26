import { useWeb3React } from "@web3-react/core"
import { useState } from "react"
import { getCurrentCompetitionIndex } from "../../domain/leaderboard/constants"
import { removeMember, useMemberTeam } from "../../domain/leaderboard/contracts"
import { useCompetition, useTeamMembersStats } from "../../domain/leaderboard/graph"
import { Team } from "../../domain/leaderboard/types"
import { shortenAddress, useChainId } from "../../lib/legacy"
import TeamMembersHeader from "./TeamMembersHeader"

type Props = {
  team: Team;
  pendingTxns: any;
  setPendingTxns: any;
  onMembersChange: () => any;
}

export function TeamMembers({ onMembersChange, team, pendingTxns, setPendingTxns }: Props) {
  const { chainId } = useChainId()
  const { library, account } = useWeb3React()
  const [page, setPage] = useState(1)
  const perPage = 5
  const { data: members, loading, revalidate: revalidateMembersStats } = useTeamMembersStats(chainId, library, team.competitionIndex, team.leaderAddress, page, perPage)
  const [isRemoving, setIsRemoving] = useState(false)
  const { data: competition } = useCompetition(chainId, team.competitionIndex)

  const { hasTeam: accountHasTeam, data: memberTeam } = useMemberTeam(chainId, library, getCurrentCompetitionIndex(chainId), account)
  const isTeamLeader = () => account && account === team.leaderAddress;

  const showTeamMembersHeader = () =>
    competition.registrationActive
    && account
    && (isTeamLeader() || (!accountHasTeam || memberTeam === team.leaderAddress))

  const pageCount = () => {
    return Math.ceil(team.members.length / perPage)
  }

  const handleRemoveClick = async (member) => {
    setIsRemoving(true)

    try {
      const tx = await removeMember(chainId, library, team.competitionIndex, team.leaderAddress, member.address, {
        successMsg: "User removed!",
        sentMsg: "User removal submitted!",
        failMsg: "User removal failed.",
        pendingTxns,
        setPendingTxns,
      })

      const receipt = await tx.wait()

      if (receipt.status === 1) {
        onMembersChange()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsRemoving(false)
    }
  }

  const Row = ({ member }) => {
    return (
      <tr key={member.address}>
        <td>{shortenAddress(member.address, 12)}</td>
        <td>{member.pnl}</td>
        <td>{member.pnlPercent}</td>
        <td>
          {isTeamLeader() && member.address !== team.leaderAddress && competition.registrationActive && (
            <button className="simple-table-action" disabled={isRemoving} onClick={() => handleRemoveClick(member)}>Remove</button>
          )}
        </td>
      </tr>
    )
  }

  return (
    <>
      <div className="Tab-title-section">
        <div className="Page-title">
          Members
        </div>
      </div>
      <div className="simple-table-container">
        {showTeamMembersHeader() && <TeamMembersHeader
          competition={competition}
          team={team}
          pendingTxns={pendingTxns}
          setPendingTxns={setPendingTxns}
          onMembersChange={() => { onMembersChange(); revalidateMembersStats(); }}
        />}
        <table className="simple-table">
          <tbody>
            <tr className="simple-table-header">
              <th>Address</th>
              <th>P&L ($)</th>
              <th>P&L (%)</th>
            </tr>
            {loading ? (
              <tr>
                <td colSpan={3}>Loading members...</td>
              </tr>
            ) : members.map(member => <Row key={member.address} member={member}/>)}
          </tbody>
        </table>
      </div>
      {pageCount() > 1 && (
        <div className="simple-table-pagination">
          <button className="default-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</button>
          <button className="default-btn" onClick={() => setPage(p => p + 1)} disabled={page === pageCount()}>Next</button>
        </div>
      )}
    </>
  )
}